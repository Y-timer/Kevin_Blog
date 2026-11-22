# Kevin Blog Ubuntu 部署说明

## 部署方式

生产目录为 `/www/wwwroot/Kevin_Blog`。Nginx 从 `frontend/dist` 提供页面，并将 `/api` 和 `/uploads` 转发给 3001 端口。后端由 `kevin-blog.service` 运行，从 `backend/.env` 读取生产配置，并把新上传的文件写入 `backend/uploads`。前端构建会应用服务器现有的 Vite 环境文件，未设置 `VITE_API_URL` 时使用同源的 `/api`。

脚本先从 GitHub 获取 `origin/main`，再把目标提交导出到独立的构建目录。前后端各自用 pnpm 锁文件安装和构建。只有两边产物均通过检查后，脚本才快进服务器的 Git 工作区并切换后端。3001 端口归属确认和健康检查通过后再更新前端。

当前 Nginx 根目录和后端工作目录都使用固定路径，应用也依赖相对路径读取生产配置和上传文件。因此采用同文件系统内的目录移动，保留上一次后端 `dist`、后端 `node_modules` 和前端 `dist`。后端重启期间有短暂中断，前端两次目录移动之间也有很短的切换窗口。新后端可能短暂服务旧前端，发布涉及 API 变更时应兼容旧前端。

生产启动使用现有表。首次接管前，请用现有 MySQL 管理渠道确认生产库已有用于图片上传的 `images` 表。可用 `SHOW TABLES LIKE 'images';` 核对。需要变更表结构时，请作为单独的数据库变更处理。`/api/health` 检查的是 HTTP 服务，首次切换后还应打开首页和现有文章，确认 API 与 MySQL 正常。

## 1. 本地 Windows 提交到 GitHub

在 PowerShell 中执行。首次提交的文件可按下面的清单选择，后续改成实际更新的文件。

```powershell
Set-Location D:\Kevin_Blog
git status --short
git add -- .gitattributes .gitignore README.md deploy.sh deploy/kevin-blog.service deploy/README.md
git add -- backend/src/index.ts backend/src/services/auth.service.ts frontend/src/services/api.ts frontend/src/services/upload.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "deploy: add safe Ubuntu deployment"
git push origin main
```

提交前确认暂存区里只有准备发布的文件。服务器的 `backend/.env` 保存在服务器本地。

## 2. Ubuntu 首次安装与接管

在确认允许配置服务器后执行本节。初次接管需要两个终端，旧的 3001 博客后端可在构建期间继续提供服务。

### 确认当前环境

```bash
cd /www/wwwroot/Kevin_Blog
git status --short --branch
git remote get-url origin
sudo ss -ltnp 'sport = :3001'
sudo stat -c '%A %U:%G %n' . backend backend/.env backend/uploads frontend frontend/dist
df -h . /var/tmp
```

以拥有服务器 `.git` 的账号执行 Git 命令，确认当前分支为 `main`、工作区干净、`origin` 指向 `Y-timer/Kevin_Blog`。如果上传目录从未创建，可先执行 `sudo mkdir -p backend/uploads`。记录 3001 的进程、原管理方式、启动命令和原文件权限，供首次接管失败时恢复。若 PID 只显示为 Node，可以用 `ps -o user,pid,ppid,args -p PID` 核实；将 `PID` 替换成刚查到的数字。确认它属于新博客目录，并确认怎样通过原管理器单独停止和启动它。

脚本和服务优先在 `/www/server/nodejs/v22.22.2/bin` 查找 Node.js，再使用系统路径。若实际安装路径不同，先将脚本和单元中的 PATH 对齐到受系统管理员控制、两个账号都可访问的目录。pnpm 仅供构建账号使用。Git、curl、`ss` 和 `flock` 分别由 Ubuntu 的 `git`、`curl`、`iproute2` 和 `util-linux` 提供。

### 创建服务账号并检查权限

已有同名账号时先核实用途。服务账号与构建账号使用各自的主组。

```bash
getent passwd kevin-blog >/dev/null ||
  sudo useradd --system --user-group --no-create-home --shell /usr/sbin/nologin kevin-blog
getent passwd kevin-blog-build >/dev/null ||
  sudo useradd --system --user-group --create-home --home-dir /var/lib/kevin-blog-build \
    --shell /usr/sbin/nologin kevin-blog-build

sudo chown root:kevin-blog backend/.env
sudo chmod 0640 backend/.env
sudo chown kevin-blog:kevin-blog backend/uploads
sudo chmod 0750 backend/uploads

sudo -u kevin-blog test -r backend/.env
sudo -u kevin-blog test -w backend/uploads
sudo -u kevin-blog test -x backend/uploads
sudo -u kevin-blog-build test ! -r backend/.env
```

保留目录中既有文件，抽查历史上传文件可由 `kevin-blog` 读取。若原 3001 进程使用其他账号，也要保留该账号接管前所需的读取和上传权限，例如只对该账号授予相应 ACL。上线目录和各级父目录应允许服务账号遍历，Nginx 账号应可访问前端静态目录。只调整 Kevin Blog 涉及的路径。

### 取出并安装单元

Git 命令仍由服务器仓库所有者执行。这里取出已推送的部署文件，为脚本保留其快进与生产配置检查流程。

```bash
git fetch --no-tags origin refs/heads/main
git log -1 --oneline FETCH_HEAD
bootstrap_dir=$(mktemp -d)
git show FETCH_HEAD:deploy.sh >"$bootstrap_dir/deploy.sh"
git show FETCH_HEAD:deploy/kevin-blog.service >"$bootstrap_dir/kevin-blog.service"
bash -n "$bootstrap_dir/deploy.sh"
sudo systemd-analyze verify "$bootstrap_dir/kevin-blog.service"
sudo install -m 0644 "$bootstrap_dir/kevin-blog.service" /etc/systemd/system/kevin-blog.service
sudo systemctl daemon-reload
```

核对当前提交和命令结果后，在第一个终端运行首次部署。

```bash
sudo bash "$bootstrap_dir/deploy.sh" --first-start
```

看到构建完成并提示停止旧进程时，在第二个终端通过已确认的原管理方式停止那个 3001 博客后端。只操作刚核实的具体进程或服务。用 `sudo ss -ltnp 'sport = :3001'` 确认端口释放后，回到第一个终端输入 `yes`。原 3001 管理项如果配置了开机启动，也需按其管理方式单独停用，避免重启后争用端口。

部署成功且确认页面和 API 可用后启用系统开机启动。

```bash
sudo systemctl enable kevin-blog
sudo systemctl status kevin-blog --no-pager
curl -fsS http://127.0.0.1:3001/api/health
```

若首次部署切换失败，脚本会停止新服务并恢复原产物。需要按事先记录的方式启动原 3001 进程。若原账号不能读取配置或是无法写入上传目录，先恢复该账号原先所需的访问权限。

## 3. 日常更新与日志

本地提交并推送到 `main` 后，在服务器执行。

```bash
cd /www/wwwroot/Kevin_Blog
sudo bash deploy.sh
```

日常服务管理使用 `sudo systemctl start kevin-blog`、`sudo systemctl stop kevin-blog`、`sudo systemctl restart kevin-blog` 或 `sudo systemctl status kevin-blog`。日常部署要求该服务正在监听 3001。

```bash
sudo tail -n 60 /www/wwwroot/Kevin_Blog/deploy.log
sudo journalctl -u kevin-blog -n 100 --no-pager
```

`deploy.log` 权限为 `0600`，记录提交、构建、重启、健康检查及部署结果。构建工具的诊断会显示在部署终端。若更新了服务模板，安装新的单元文件并执行 `sudo systemctl daemon-reload` 后再部署。

## 4. 失败与恢复

- **构建或快进失败。** 服务与前端仍从原路径提供请求。按部署日志中的失败步骤修正后重新执行部署。服务器有本地 Git 修改时，先检查并单独保留这些修改。
- **发布或健康检查失败。** 日常部署会尝试恢复原产物、启动旧后端并重新检查健康。Git 工作区可能已快进到目标提交。修正后重新推送并部署即可，脚本可以重新构建同一个提交。
- **需要回到之前的代码。** 优先在 Windows 上用 Git 创建一个撤销问题改动的新提交并重新部署。上一次可用产物保存在 `.deploy/previous/backup`。紧急恢复时应先停 `kevin-blog`，保留当前产物，再成套恢复备份里的三个目录。恢复后启动 `kevin-blog` 并检查健康与页面。
- **进程被强制终止或机器断电。** `.deploy/switching` 记录本轮 `run.*` 目录名。先确认没有部署在执行。如果 `.deploy/previous` 已指向这一轮且后端和页面健康，说明发布已完成，可以移除 `switching` 标记。如果发布没有完成，停止 `kevin-blog`，检查该轮 `backup`，把已移入其中的原产物移回对应线上路径。在移回每项前，把同名的现有新产物移到另一个空目录留存。完成后按首次接管或日常更新的原管理方式启动 3001，确认恢复后才移除标记。

恢复涉及的目录只有 `backend/dist`、`backend/node_modules` 和 `frontend/dist`。手工移动时应使用相同文件系统上的备份位置。首次接管前遗留的产物仍按当时的启动方式和数据库权限管理。
