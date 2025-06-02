// src/directives/permission.ts
import { Directive, DirectiveBinding, ObjectDirective } from 'vue'

// 权限指令的类型定义
interface PermissionDirectiveBinding extends Omit<DirectiveBinding, 'modifiers'> {
  value: string | string[] // 需要的权限码
  modifiers: {
    disable?: boolean // 是否禁用元素而不仅是阻止点击
  }
}

// 权限检查函数 (实际项目中可以从 store 或 API 获取)
const checkPermission = (requiredPermission: string | string[]): boolean => {
  // 这里模拟权限检查，实际项目中应该从 store 或全局状态获取
  const userPermissions = ['pro'] // 模拟当前用户权限
  
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some(perm => userPermissions.includes(perm))
  }
  return userPermissions.includes(requiredPermission)
}

// 权限指令实现
export const vPermission: ObjectDirective<HTMLElement, string | string[]> = {
  mounted(el: HTMLElement, binding: PermissionDirectiveBinding) {
    const hasPermission = checkPermission(binding.value)
    
    if (!hasPermission) {
      if (binding.modifiers.disable) {
        // 禁用模式：直接禁用元素
        el.style.opacity = '0.5'
        el.style.pointerEvents = 'none'
      } else {
        // 默认模式：拦截点击事件
        el.addEventListener('click', stopEvent, true)
      }
    }
  },
  beforeUnmount(el: HTMLElement, binding: PermissionDirectiveBinding) {
    if (!checkPermission(binding.value)) {
      el.removeEventListener('click', stopEvent, true)
    }
  }
}

// 阻止事件冒泡和默认行为
function stopEvent(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  // 可以在这里添加全局权限提示
  console.warn('您没有执行此操作的权限')
}