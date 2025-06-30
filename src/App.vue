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
        <v-spacer></v-spacer>
        <!-- 社群审核按钮（所有用户可见） -->
        <v-btn text @click="openCommunityReviewDialog">
          社群审核
          <v-icon right>mdi-clipboard-check</v-icon>
        </v-btn>
        <v-btn text @click="logout">
          退出登录
          <v-icon right>mdi-logout</v-icon>
        </v-btn>
      </v-app-bar>
    </template>

    <v-main>
      <router-view>
      </router-view>
    </v-main>

    <!-- 社群审核对话框 -->
    <v-dialog v-model="communityReviewDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="headline">
          <v-icon left>mdi-clipboard-check</v-icon>
          社群审核管理
          <v-spacer></v-spacer>
          <v-btn icon @click="communityReviewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-data-table
            :headers="communityHeaders"
            :items="pendingCommunities"
            :loading="communityLoading"
            class="elevation-1"
            no-data-text="暂无待审核的社群"
            loading-text="正在加载社群数据..."
          >
            <template #[`item.actions`]="{ item }">
              <v-btn 
                color="success" 
                small 
                class="mr-2" 
                @click="approveCommunity(item)"
                :loading="item.processing"
              >
                通过
              </v-btn>
              <v-btn 
                color="error" 
                small 
                @click="rejectCommunity(item)"
                :loading="item.processing"
              >
                拒绝
              </v-btn>
            </template>
            <template #[`item.createdAt`]="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
            <template #[`item.status`]="{ item }">
              <v-chip :color="item.status === 0 ? 'orange' : 'green'" small dark>
                {{ item.status === 0 ? '待审核' : '已启用' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="refreshCommunityList">刷新</v-btn>
          <v-btn @click="communityReviewDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
        ],
        currentItemTitle: '欢迎来到游学系统',
        snackbar: {
          show: false,
          text: '',
          color: 'success',
          timeout: 3000
        },
        // 社群审核相关数据
        communityReviewDialog: false,
        communityLoading: false,
        pendingCommunities: [],
        communityHeaders: [
          { text: 'ID', value: 'id', width: 80 },
          { text: '社群名称', value: 'name' },
          { text: '描述', value: 'description' },
          { text: '创建者ID', value: 'ownerId', width: 100 },
          { text: '状态', value: 'status', width: 100 },
          { text: '创建时间', value: 'createdAt', width: 150 },
          { text: '操作', value: 'actions', sortable: false, width: 150 }
        ]
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
      // 打开社群审核对话框
      async openCommunityReviewDialog() {
        this.communityReviewDialog = true;
        await this.loadPendingCommunities();
      },

      // 加载待审核社群列表
      async loadPendingCommunities() {
        this.communityLoading = true;
        try {
          const response = await this.$axios.get('/api/community/listByStatus', {
            params: { status: 0 }
          });
          if (response.data.code === 1) {
            this.pendingCommunities = response.data.data.map(community => ({
              ...community,
              processing: false // 添加处理状态标记
            }));
          } else {
            this.showSnackbar('获取社群列表失败: ' + response.data.msg, 'error');
          }
        } catch (error) {
          console.error('获取待审核社群失败:', error);
          this.showSnackbar('获取社群列表失败', 'error');
        } finally {
          this.communityLoading = false;
        }
      },

      // 审核通过社群
      async approveCommunity(community) {
        community.processing = true;
        try {
          const response = await this.$axios.post('/api/community/updateStatus', {
            communityId: community.id,
            status: 1
          });
          if (response.data.code === 1) {
            this.showSnackbar(`社群 "${community.name}" 审核通过`, 'success');
            await this.refreshCommunityList();
          } else {
            this.showSnackbar('审核失败: ' + response.data.msg, 'error');
          }
        } catch (error) {
          console.error('审核社群失败:', error);
          this.showSnackbar('审核失败', 'error');
        } finally {
          community.processing = false;
        }
      },

      // 拒绝社群申请
      async rejectCommunity(community) {
        community.processing = true;
        try {
          const response = await this.$axios.post('/api/community/updateStatus', {
            communityId: community.id,
            status: 0
          });
          if (response.data.code === 1) {
            this.showSnackbar(`社群 "${community.name}" 已拒绝`, 'warning');
            await this.refreshCommunityList();
          } else {
            this.showSnackbar('操作失败: ' + response.data.msg, 'error');
          }
        } catch (error) {
          console.error('拒绝社群失败:', error);
          this.showSnackbar('操作失败', 'error');
        } finally {
          community.processing = false;
        }
      },

      // 刷新社群列表
      async refreshCommunityList() {
        await this.loadPendingCommunities();
      },

      // 格式化日期
      formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
      },

      async logout() {
        try {
          await this.$axios.post('/api/users/logout');
          this.showSnackbar('您已成功退出登录', 'success');
        } catch (error) {
          console.error('退出登录失败:', error);
          // 即使后端API调用失败，也执行前端的登出流程
          this.showSnackbar('本地退出登录成功', 'info');
        } finally {
          // 清理本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // 强制刷新菜单项
          this.menuItems = this.getMenuItems();

          // 跳转到登录页面
          if (this.$route.path !== '/LoginRegister') {
            this.$router.push('/LoginRegister');
          }
        }
      },
      
      getMenuItems() {
        const baseItems = [
          { title: '发现社群', icon: 'mdi-radar', iconColor: 'indigo', to: '/FrontPage' },
          { title: '个人主页', icon: 'mdi-account-circle', iconColor: 'indigo', to: '/profile/:id' }
        ];
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user && user.userId) {
            const profileItem = baseItems.find(item => item.title === '个人主页');
            if (profileItem) {
              profileItem.to = `/profile/${user.userId}`;
            }
          }
          if (user && (user.isAdmin === '1' || user.isAdmin === 1)) {
            baseItems.push({
              title: '后台管理',
              icon: 'mdi-shield-account',
              iconColor: 'red',
              to: '/admin'
            });
          }
        } catch(e) {
          console.error("解析用户信息失败", e);
        }
        return baseItems;
      },
      
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
          this.currentItemTitle = currentItem ? currentItem.title : '发现社群';
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