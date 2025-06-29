<template>
  <v-app id="root">
    <template v-if="$route.path != '/LoginRegister'">
      <!-- 侧边导航栏 -->
      <v-navigation-drawer v-model="drawer" class="d-none d-sm-none d-md-flex " app>
        <v-list-item class="mt-12 d-flex flex-column">
          <v-list-item-content>
            <v-list-item-title style="font-weight: bold;font-size:35px;">LearningHub</v-list-item-title>
            <v-list-item-subtitle style="font-weight: bold;font-size:30px;">Welcome!</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider :style="{ 'border-bottom-width': '1px' }" class="mx-8 my-2"></v-divider>
        <v-list-item-title class="ml-5 mb-1 indigo--text text-h5 font-weight-black">
          <v-icon color="indigo" class="mb-1 mr-1" large>
            mdi-apple-safari
          </v-icon>
          NaviBar
        </v-list-item-title>
        <v-divider :style="{ 'border-bottom-width': '1px' }" class="mx-8 my-2"></v-divider>

        <v-list dense nav>
          <v-list-item v-for="item in menuItems" :key="item.title" :to="item.to" link class="align-center" mandatory
            color="indigo">
            <!-- 使用 mx-n 类来减少图标和内容之间的间距 -->
            <v-list-item-avatar :color="item.iconColor" class="d-flex align-center justify-center" min-width="30"
              min-height="30" rounded="circle">
              <v-icon color="white" class="ma-0">{{ item.icon }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title style="font-size: 16px; font-weight: bold;">{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-bottom-navigation fixed style="background:none;">
          <v-card class="d-flex flex-row-reverse justify-center mb-8" style="background:none;" flat hover light>
            <v-btn class="mt-7 mb-7" text small depressed fab plain block
              onclick="window.open('https://github.com/12345txy/learninghub_frontend.git')"> <v-icon>
                mdi-github
              </v-icon>
            </v-btn>
          </v-card>
        </v-bottom-navigation>
      </v-navigation-drawer>

      <!-- 顶部导航栏 -->
      <v-app-bar elevation="5" app color="indigo" dark dense border="bottom">
        <div class="d-flex align-center">
          <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
          <v-toolbar-title>{{currentItemTitle}}</v-toolbar-title>
        </div>
      </v-app-bar>
    </template>

    <v-main>
      <router-view>
      </router-view>
    </v-main>

    <!-- ✅ 全局 Snackbar -->
    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script>
  export default {
    name: 'App',
    data() {
      return {
        drawer: false,
        menuItems: [
          { title: '发现社群', icon: 'mdi-radar', iconColor: 'indigo', to: '/FrontPage' },
          { title: '个人主页', icon: 'mdi-account-circle', iconColor: 'indigo', to: '/profile/:id' }
          // { title: '发布帖子', icon: 'mdi-pencil', iconColor: 'blue', to: '/CreatePost' },
          // { title: '兴趣社群', icon: 'mdi-account-group', iconColor: 'purple', to: '/communities' },
        ],
        currentItemTitle: '欢迎来到游学系统',
        snackbar: {
          show: false,
          text: '',
          color: 'success',
          timeout: 3000
        }
      };
    },
    created() {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // 🔥 动态设置个人主页路由
        if (user && user.userId) {
          const profileItem = this.menuItems.find(item => item.title === '个人主页');
          if (profileItem) {
            profileItem.to = `/profile/${user.userId}`;
          }
        } else {
          // 如果没有用户ID，默认跳转到 '/profile/me'
          const profileItem = this.menuItems.find(item => item.title === '个人主页');
          if (profileItem) {
            profileItem.to = '/profile/me';
          }
        }
        
        // 管理员菜单逻辑
        if (user && (user.isAdmin === '1' || user.isAdmin === 1)) {
          this.menuItems.push({
            title: '后台管理',
            icon: 'mdi-shield-account',
            iconColor: 'red',
            to: '/admin'
          });
        }
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
      this.$root.$showSnackbar = this.showSnackbar;
      console.log(this.$router.resolve('/admin'));
    },

    methods: {
      showSnackbar(text, color = 'success') {
        this.snackbar.text = text;
        this.snackbar.color = color;
        this.snackbar.show = true;
      }
    },

    computed: {
      isAdmin() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;
        try {
          const user = JSON.parse(userStr);
          return user && (user.isAdmin === 1 || user.isAdmin === '1');
        } catch (e) {
          return false;
        }
      }
    },

    watch: {
      $route: {
        handler(to) {
          // 获取当前路由路径对应的菜单项标题
          const currentItem = this.menuItems.find(item => item.to === to.path);
          // 如果找到对应的菜单项，设置标题，否则保持默认标题
          this.currentItemTitle = currentItem ? currentItem.title : '编辑日记';
        },
        immediate: true // 确保在路由变化时立即执行
      }
    }
  };
</script>

<style>
  .list-item-custom-height {
    height: 50px;
  }
</style>