#!/usr/bin/env bash
set -euo pipefail
umask 077

PROJECT=/www/wwwroot/Kevin_Blog
STATE=$PROJECT/.deploy
UNIT=kevin-blog.service
SERVICE_USER=kevin-blog
BUILD_USER=kevin-blog-build
export PATH=/www/server/nodejs/v22.22.2/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

artifacts=(backend/dist backend/node_modules frontend/dist)
first_start=0
step='检查部署环境'
work=''
build=''
old_previous=''
git_user=''
build_home=''

log() {
  local message
  printf -v message '[%s] %s' "$(date '+%F %T %z')" "$*"
  printf '%s\n' "$message" >&8
  printf '%s\n' "$message"
}

fail() {
  log "$*"
  exit 1
}

git_project() {
  sudo -H -u "$git_user" -- env GIT_TERMINAL_PROMPT=0 git -c core.hooksPath=/dev/null "$@" 8>&- 9>&-
}

as_builder() {
  # 使用独立账号和干净环境。生产后端 .env 不进入构建目录。
  runuser -u "$BUILD_USER" -- env -i HOME="$build_home" PATH="$PATH" CI=true "$@" 8>&- 9>&-
}

build_in() (
  cd -- "$build/$1"
  shift
  as_builder "$@"
)

check_clean() {
  local status untracked flags
  status=$(git_project status --porcelain=v1 --untracked-files=no)
  # 首次接管时旧提交还没有忽略 .deploy，部署脚本会先在这里加锁。
  untracked=$(git_project ls-files --others --exclude-standard -- . ':(top,exclude).deploy')
  [[ -z $status && -z $untracked ]] || fail 'Git 有未提交或未跟踪的文件。请先检查并保留本地修改。'
  flags=$(git_project ls-files -v)
  if [[ $flags =~ (^|$'\n')[a-zS]\  ]]; then
    fail 'Git 索引有 assume-unchanged 或 skip-worktree 标记，请先检查。'
  fi
}

check_tracked_paths() {
  local commit=$1 path
  for path in backend frontend; do
    [[ $(git_project cat-file -t "$commit:$path") == tree ]] || fail "Git 版本缺少项目目录 $path。"
  done
  git_project ls-tree -r --name-only -z "$commit" |
    while IFS= read -r -d '' path; do
      case "${path##*/}" in
        .env.example) ;;
        .env | .env.*) fail 'Git 版本包含受保护的 .env 文件。' ;;
      esac
      case "$path/" in
        backend/uploads/* | frontend/uploads/* | backend/dist/* | frontend/dist/* | \
        backend/node_modules/* | frontend/node_modules/* | .deploy/* | deploy.log/*)
          fail 'Git 版本包含受保护的运行目录或部署文件。'
          ;;
      esac
    done
}

port_listeners() {
  ss -H -ltnp 'sport = :3001'
}

unit_owns_port() {
  local pid listeners
  systemctl is-active --quiet "$UNIT" || return 1
  pid=$(systemctl show --property=MainPID --value "$UNIT") || return 1
  [[ $pid =~ ^[1-9][0-9]*$ ]] || return 1
  listeners=$(port_listeners) || return 1
  [[ -n $listeners ]] || return 1
  # 每个监听 3001 的 socket 都应归当前服务的 Node 进程所有。
  ! grep -qvF "pid=$pid," <<<"$listeners"
}

wait_for_health() {
  local attempt
  for ((attempt = 1; attempt <= 25; attempt++)); do
    if unit_owns_port &&
      curl --disable --noproxy '*' --silent --fail --max-time 2 http://127.0.0.1:3001/api/health |
        grep -E '"status"[[:space:]]*:[[:space:]]*"ok"' >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

publish() {
  local artifact=$1
  mv -T -- "$PROJECT/$artifact" "$work/backup/$artifact"
  mv -T -- "$work/candidate/$artifact" "$PROJECT/$artifact"
}

restore() {
  local artifact
  systemctl stop "$UNIT" || return 1
  for artifact in "${artifacts[@]}"; do
    [[ -d $work/backup/$artifact ]] || continue
    if [[ -e $PROJECT/$artifact ]]; then
      mv -T -- "$PROJECT/$artifact" "$work/rejected/$artifact" || return 1
    fi
    mv -T -- "$work/backup/$artifact" "$PROJECT/$artifact" || return 1
  done
  if (( first_start )); then
    log '已恢复原产物。请通过原管理方式启动首次接管前的 3001 后端。'
  else
    systemctl start "$UNIT" && wait_for_health || return 1
    log '已恢复旧产物，旧后端健康检查通过。'
  fi
}

finish() {
  local result=$1 previous
  trap - EXIT
  trap '' INT TERM HUP
  set +e

  if [[ -n $build ]]; then
    rm -rf --one-file-system -- "$build" || log "构建目录待清理：$build"
  fi
  previous=$(readlink -- "$STATE/previous" 2>/dev/null)
  if [[ -n $work && $previous == "${work##*/}" ]]; then
    # previous 链接替换成功即完成发布，保留这一轮备份。
    rm -f -- "$STATE/switching" || log '请检查部署状态文件 switching。'
    rm -rf --one-file-system -- "$work/candidate" "$work/rejected"
    if [[ $old_previous =~ ^run\.[[:alnum:]]{8}$ && $old_previous != "$previous" ]]; then
      rm -rf --one-file-system -- "${STATE:?}/${old_previous:?}" || log '旧备份待清理。'
    fi
    log "部署成功，上一个版本的产物位于 $STATE/previous/backup"
    exit 0
  fi

  log "部署失败，步骤：$step，退出码：$result"
  if [[ -n $work && -f $STATE/switching ]]; then
    log '正在恢复切换前的运行产物。'
    if restore && rm -f -- "$STATE/switching"; then
      log '回滚完成。'
    else
      log "回滚未完成，保留 $work，请按部署说明人工恢复。"
      exit 1
    fi
  fi
  if [[ -n $work ]]; then
    rm -rf --one-file-system -- "$work" || log "部署临时目录待清理：$work"
  fi
  exit "$result"
}

main() {
  local cmd before target config_file artifact listeners answer node_version pnpm_version
  if [[ $# == 1 && $1 == --first-start ]]; then
    first_start=1
  elif (( $# != 0 )); then
    printf '用法：sudo bash deploy.sh [--first-start]\n' >&2
    exit 2
  fi
  if (( EUID != 0 )) || [[ $(pwd -P) != "$PROJECT" ]]; then
    printf '请进入 %s 后执行 sudo bash deploy.sh。\n' "$PROJECT" >&2
    exit 1
  fi

  if [[ -L $STATE || -L deploy.log || ( -e deploy.log && ! -f deploy.log ) ]]; then
    printf '部署状态或日志的路径异常。\n' >&2
    exit 1
  fi
  mkdir -p -- "$STATE"
  if [[ $(stat -c '%u:%a' -- "$STATE") != 0:700 ]] ||
    { [[ -e deploy.log ]] && [[ $(stat -c '%u:%h' -- deploy.log) != 0:1 ]]; }; then
    printf '请检查 .deploy 和 deploy.log 的所有者与权限。\n' >&2
    exit 1
  fi
  exec 9>"$STATE/lock"
  flock -n 9 || { printf '另一个博客部署正在运行。\n' >&2; exit 1; }
  exec 8>>deploy.log
  chmod 0600 -- deploy.log
  trap 'finish "$?"' EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  trap 'exit 129' HUP
  log '开始部署。'
  [[ ! -e $STATE/switching ]] || fail '检测到上次切换未收尾，请按部署说明检查后再运行。'

  for cmd in git node pnpm sudo runuser systemctl ss curl; do
    command -v "$cmd" >/dev/null || fail "缺少命令 $cmd，请检查部署说明中的工具路径。"
  done
  id "$SERVICE_USER" >/dev/null
  build_home=$(getent passwd "$BUILD_USER" | cut -d: -f6)
  [[ -n $build_home && -d $build_home ]] || fail '请先创建构建账号及其 home 目录。'
  node_version=$(as_builder node --version)
  pnpm_version=$(as_builder pnpm --version)
  runuser -u "$SERVICE_USER" -- env PATH="$PATH" node --version >/dev/null ||
    fail '服务账号无法运行 Node.js。'
  log "构建工具 Node.js $node_version，pnpm $pnpm_version"
  [[ -d .git && ! -L .git ]] || fail '当前目录需要是独立 Git 克隆。'
  git_user=$(stat -c %U -- .git)
  [[ $(git_project symbolic-ref --quiet --short HEAD) == main ]] || fail '当前 Git 分支需要是 main。'
  for artifact in backend frontend backend/uploads "${artifacts[@]}"; do
    [[ -d $artifact && ! -L $artifact ]] || fail "需要真实目录 $artifact。"
    [[ $(stat -c %d -- "$artifact") == "$(stat -c %d -- "$STATE")" ]] ||
      fail "目录 $artifact 需要和 .deploy 位于同一文件系统。"
  done
  [[ -f backend/.env && ! -L backend/.env ]] || fail '缺少常规生产文件 backend/.env。'
  runuser -u "$SERVICE_USER" -- test -r backend/.env || fail '服务账号无法读取 backend/.env。'
  if ! runuser -u "$SERVICE_USER" -- test -w backend/uploads ||
    ! runuser -u "$SERVICE_USER" -- test -x backend/uploads; then
    fail '服务账号无法写入 uploads。'
  fi
  if as_builder test -r backend/.env; then
    fail '构建账号可以读取 backend/.env，请收紧权限。'
  fi
  [[ $(systemctl show --property=LoadState --value "$UNIT") == loaded &&
     $(systemctl show --property=User --value "$UNIT") == "$SERVICE_USER" &&
     $(systemctl show --property=WorkingDirectory --value "$UNIT") == "$PROJECT/backend" ]] ||
    fail '请先安装此仓库提供的 kevin-blog systemd 单元。'
  if (( first_start )); then
    if systemctl is-active --quiet "$UNIT"; then
      fail '服务已经启动，请使用常规部署命令。'
    fi
  else
    unit_owns_port || fail '3001 未由 kevin-blog 服务监听。首次接管请参阅部署说明。'
  fi

  step='检查 Git 工作区和远端版本'
  check_clean
  before=$(git_project rev-parse HEAD)
  log "部署前 Git commit：$before"
  git_project fetch --no-tags origin refs/heads/main >/dev/null 2>&1 ||
    fail '拉取 origin/main 失败，请检查远端地址和仓库账号的 Git 凭据。'
  target=$(git_project rev-parse 'FETCH_HEAD^{commit}')
  log "目标 Git commit：$target"
  git_project merge-base --is-ancestor "$before" "$target" || fail '服务器 main 无法快进到远端 main。'
  check_tracked_paths "$before"
  check_tracked_paths "$target"

  step='准备独立构建目录'
  old_previous=$(readlink -- "$STATE/previous" 2>/dev/null || true)
  work=$(mktemp -d "$STATE/run.XXXXXXXX")
  build=$(mktemp -d /var/tmp/kevin-blog-build.XXXXXXXX)
  chown -- "$BUILD_USER:" "$build"
  git_project archive "$target" | as_builder tar -x -C "$build"
  # Vite 会按原有优先级读取这些文件。仅复制前端构建配置。
  for config_file in .env .env.local .env.production .env.production.local; do
    [[ -e frontend/$config_file || -L frontend/$config_file ]] || continue
    [[ -f frontend/$config_file && ! -L frontend/$config_file ]] || fail "前端配置 $config_file 需要是常规文件。"
    install -m 0600 -o "$BUILD_USER" -- "frontend/$config_file" "$build/frontend/$config_file"
  done

  step='安装后端依赖'
  build_in backend pnpm install --frozen-lockfile
  step='生成 Prisma Client'
  build_in backend pnpm run db:generate
  step='构建后端'
  build_in backend pnpm run build
  [[ -s $build/backend/dist/index.js && -d $build/backend/node_modules ]]
  log '后端构建通过。'

  step='安装前端依赖'
  build_in frontend pnpm install --frozen-lockfile
  step='构建前端'
  build_in frontend pnpm run build
  [[ -s $build/frontend/dist/index.html ]]
  log '前端构建通过。'

  step='准备发布产物'
  mkdir -p -- "$work"/{backup,candidate,rejected}/{backend,frontend}
  for artifact in "${artifacts[@]}"; do
    [[ -d $build/$artifact && ! -L $build/$artifact ]] || fail "构建产物目录异常：$artifact"
    cp -a --no-preserve=ownership -- "$build/$artifact" "$work/candidate/$artifact"
    chmod -R a+rX,u+rw,go-w -- "$work/candidate/$artifact"
  done
  listeners=$(find "$work/candidate/frontend/dist" ! -type f ! -type d -print -quit)
  [[ -z $listeners ]] || fail '前端发布目录包含非常规文件。'
  ln -s -- "${work##*/}" "$work/next-previous"

  step='快进服务器 main'
  check_clean
  [[ $(git_project rev-parse HEAD) == "$before" && $(git_project branch --show-current) == main ]] ||
    fail '构建期间 Git 分支或版本发生变化，请重新部署。'
  git_project merge --ff-only --no-overwrite-ignore "$target" >/dev/null 2>&1 ||
    fail 'Git 快进失败，请检查工作区和服务器本地配置。'
  log "更新后 Git commit：$target"

  step='确认 3001 后端切换条件'
  if (( first_start )); then
    listeners=$(port_listeners)
    if [[ -n $listeners ]]; then
      log '构建完成。请在另一个终端按原管理方式停止当前 3001 博客后端。'
      read -r -p '确认 3001 已释放后请输入 yes：' answer </dev/tty
      [[ $answer == yes ]] || fail '已取消首次接管。'
    fi
    listeners=$(port_listeners)
    [[ -z $listeners ]] || fail '3001 仍被占用。'
    if systemctl is-active --quiet "$UNIT"; then
      fail 'kevin-blog 已经启动，请重新检查服务状态。'
    fi
  else
    unit_owns_port || fail '切换前检查发现 3001 已不归 kevin-blog 服务。'
  fi

  # 切换前写入位置，强制中断后可用这个文件找到备份。
  printf '%s\n' "${work##*/}" >"$work/switching"
  mv -T -- "$work/switching" "$STATE/switching"
  step='停止 kevin-blog 服务并切换后端产物'
  if (( ! first_start )); then
    systemctl stop "$UNIT"
  fi
  publish backend/dist
  publish backend/node_modules

  step='重启 kevin-blog 服务'
  systemctl restart "$UNIT"
  log 'systemd 重启命令执行成功。'
  step='检查 3001 端口和 /api/health'
  wait_for_health
  log '3001 由 kevin-blog 监听，健康检查通过。'

  step='发布前端和登记旧产物'
  publish frontend/dist
  mv -Tf -- "$work/next-previous" "$STATE/previous"
}

main "$@"
