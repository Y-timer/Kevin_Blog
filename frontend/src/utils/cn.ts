/**
 * className 合并工具函数
 * 过滤掉 false/null/undefined 后拼接为空格分隔的字符串
 *
 * 示例：
 * cn('fixed', scrolled && 'shadow', isActive ? 'text-cyan' : 'text-gray')
 * // → 'fixed shadow text-cyan'
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
