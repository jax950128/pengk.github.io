import Vue from 'vue'
import Router from 'vue-router'
import routes from './routes'
import store from '@/store'
import { formatRoutes } from "@/utils/util/util.js";
import { getToken, removeToken } from '@/utils/auth'

Vue.use(Router)

const isDevelopment = process.env.NODE_ENV === 'development'

const router = new Router({
  routes:[].concat(...formatRoutes(store.state.user.routeMenu), routes),
  mode:  'hash'
  // mode: isDevelopment ? 'hash' : 'history'
})

const hasPermission = (auths, permissionAuths) => {
  return permissionAuths ? permissionAuths.some(item => auths.includes(item)) : 1
}



router.beforeEach(async (to, from, next) => {
  // console.log(to, from);
  if(to.name==from.name)return;
  Vue.prototype.$Loading.start()
  let token = getToken()
  let isToLogin = to.name === 'Login'
  let auths = store.state.user.auths
  let hasUserInfo = auths.length !== 0

  if (token) {
    if (isToLogin) {
      // 已登录且要跳转的页面是登录页 跳转到home页
      next({ name: 'MainView' })
      Vue.prototype.$Loading.finish()
    } else {
      if (hasUserInfo) {
        if (hasPermission(auths, to.meta.auths)) {
          next()
        } else {
          next({ path: '/401', replace: true })
        }
      } else {
        let res = await store.dispatch('user/getUserInfo')
        if (res) {
          // 获取用户信息
          next()
        } else {
          // 获取用户信息失败
          removeToken()
          next({ name: 'Login' })
        }
      }
    }
  } else {
    if (isToLogin) {
      // 未登陆且要跳转的页面是登录页
      next()
    } else {
      // 未登录且要跳转的页面不是登录页 跳转到登录页
      next({ name: 'Login' })
      Vue.prototype.$Loading.finish()
    }
  }
})

router.afterEach((to, from) => {
  const title = to.meta && to.meta.title
  if (title) document.title = title

  Vue.prototype.$Loading.finish()
})

export default router
