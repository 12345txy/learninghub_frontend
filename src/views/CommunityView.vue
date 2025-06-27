<template>
  <v-container fluid class="pa-0" style="height: 100vh;">
    <v-row no-gutters style="height: 100%;">
      <!-- 左侧：社群信息和成员列表 -->
      <v-col cols="3" class="border-right">
        <v-card flat tile style="height: 100%; overflow-y: auto;">
          <!-- 社群基本信息 -->
          <v-card-title class="px-4 py-3 border-bottom">
            <div class="d-flex align-center w-100">
              <v-avatar size="50" class="mr-3">
                <v-img :src="community.avatarUrl || defaultAvatar"></v-img>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">{{ community.name }}</div>
                <div class="text-caption text--secondary">
                  {{ community.memberCount || 0 }} 名成员
                </div>
              </div>
            </div>
          </v-card-title>

          <!-- 社群描述 -->
          <v-card-text class="px-4 py-3 border-bottom">
            <div class="text-body-2 text--secondary">
              {{ community.description }}
            </div>
            <div class="mt-2">
              <v-chip small color="primary" outlined class="mr-1">
                {{ community.categoryName }}
              </v-chip>
              <v-chip small color="indigo" outlined>
                #{{ formatCommunityType(community.type) }}
              </v-chip>
            </div>
          </v-card-text>

          <!-- 功能按钮区 -->
          <v-card-text class="px-4 py-2 border-bottom">
            <v-btn
              v-if="isAdmin || isOwner"
              small
              color="primary"
              outlined
              block
              class="mb-2"
              @click="manageDialog = true"
            >
              <v-icon left small>mdi-account-cog</v-icon>
              成员管理
            </v-btn>
            <v-btn
              small
              color="success"
              outlined
              block
              class="mb-2"
              @click="checkInDialog = true"
            >
              <v-icon left small>mdi-calendar-check</v-icon>
              打卡任务
            </v-btn>
            <v-btn
              v-if="!isOwner"
              small
              color="error"
              outlined
              block
              @click="leaveCommunity"
            >
              <v-icon left small>mdi-exit-to-app</v-icon>
              退出社群
            </v-btn>
          </v-card-text>

          <!-- 在线成员列表 -->
          <v-subheader class="px-4">
            在线成员 ({{ onlineCount }})
          </v-subheader>
          
          <!-- 成员列表 -->
          <v-list dense class="py-0">
            <v-list-item
              v-for="member in members"
              :key="member.id"
              class="px-4"
            >
              <v-list-item-avatar size="32">
                <v-img :src="member.avatarUrl || defaultAvatar"></v-img>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title class="text-body-2">
                  {{ member.username }}
                  <v-chip
                    v-if="member.role === 'OWNER'"
                    x-small
                    color="red"
                    text-color="white"
                    class="ml-1"
                  >群主</v-chip>
                  <v-chip
                    v-else-if="member.role === 'ADMIN'"
                    x-small
                    color="orange"
                    text-color="white"
                    class="ml-1"
                  >管理员</v-chip>
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-icon
                  small
                  :color="member.isOnline ? 'green' : 'grey'"
                >
                  mdi-circle
                </v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- 右侧：聊天区域 -->
      <v-col cols="9">
        <v-card flat tile style="height: 100%; display: flex; flex-direction: column;">
          <!-- 聊天头部 -->
          <v-card-title class="px-4 py-3 border-bottom flex-shrink-0">
            <v-icon class="mr-2">mdi-chat</v-icon>
            <span>群聊</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="loadChatHistory">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>

          <!-- 聊天消息区域 -->
          <div
            ref="chatContainer"
            class="flex-grow-1 pa-3"
            style="overflow-y: auto; background-color: #f5f5f5;"
          >
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            
            <div v-for="message in messages" :key="message.id" class="mb-3">
              <div
                :class="[
                  'd-flex',
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                ]"
              >
                <div
                  :class="[
                    'message-bubble',
                    'pa-3',
                    'rounded-lg',
                    'max-width-70',
                    message.senderId === currentUserId ? 'own-message' : 'other-message'
                  ]"
                >
                  <div v-if="message.senderId !== currentUserId" class="text-caption text--secondary mb-1">
                    {{ message.senderName }}
                  </div>
                  <div class="text-body-2">{{ message.content }}</div>
                  <div class="text-caption text--secondary text-right mt-1">
                    {{ formatTime(message.createdAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 消息输入区域 -->
          <div class="flex-shrink-0 border-top">
            <v-card-text class="px-4 py-3">
              <v-row no-gutters align="center">
                <v-col>
                  <v-text-field
                    v-model="newMessage"
                    placeholder="输入消息..."
                    outlined
                    dense
                    hide-details
                    @keyup.enter="sendMessage"
                    :disabled="isBanned"
                  ></v-text-field>
                </v-col>
                <v-col cols="auto" class="ml-2">
                  <v-btn
                    color="primary"
                    @click="sendMessage"
                    :disabled="!newMessage.trim() || isBanned"
                  >
                    <v-icon>mdi-send</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
              <div v-if="isBanned" class="text-caption text--error mt-1">
                您已被禁言，无法发送消息
              </div>
            </v-card-text>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成员管理对话框 -->
    <v-dialog v-model="manageDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">成员管理</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="manageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <!-- 待审核申请 -->
          <v-subheader>待审核申请</v-subheader>
          <v-list v-if="pendingApplications.length > 0">
            <v-list-item
              v-for="application in pendingApplications"
              :key="application.id"
            >
              <v-list-item-content>
                <v-list-item-title>{{ application.username }}</v-list-item-title>
                <v-list-item-subtitle>{{ application.reason }}</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  small
                  color="success"
                  @click="reviewApplication(application.id, 'APPROVED')"
                  class="mr-1"
                >
                  同意
                </v-btn>
                <v-btn
                  small
                  color="error"
                  @click="reviewApplication(application.id, 'REJECTED')"
                >
                  拒绝
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-4 text--secondary">
            暂无待审核申请
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- 成员操作 -->
          <v-subheader>成员操作</v-subheader>
          <v-list>
            <v-list-item
              v-for="member in members"
              :key="member.id"
            >
              <v-list-item-avatar>
                <v-img :src="member.avatarUrl || defaultAvatar"></v-img>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ member.username }}</v-list-item-title>
                <v-list-item-subtitle>{{ member.role }}</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action v-if="member.role !== 'OWNER'">
                <v-menu bottom left>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn icon v-bind="attrs" v-on="on">
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="setAdmin(member.id)" v-if="member.role !== 'ADMIN' && isOwner">
                      <v-list-item-title>设为管理员</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="cancelAdmin(member.id)" v-if="member.role === 'ADMIN' && isOwner">
                      <v-list-item-title>取消管理员</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="banMember(member.id)" v-if="!member.isBanned">
                      <v-list-item-title>禁言</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="unbanMember(member.id)" v-if="member.isBanned">
                      <v-list-item-title>解除禁言</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="removeMember(member.id)" class="error--text">
                      <v-list-item-title>踢出群聊</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 打卡任务对话框 -->
    <v-dialog v-model="checkInDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">打卡任务</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="checkInDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <!-- 创建打卡任务 (仅管理员可见) -->
          <div v-if="isAdmin || isOwner" class="mb-4">
            <v-text-field
              v-model="newTaskName"
              label="创建新的打卡任务"
              placeholder="例如：每日算法题"
              outlined
              dense
              append-icon="mdi-plus"
              @click:append="createCheckInTask"
              @keyup.enter="createCheckInTask"
            ></v-text-field>
          </div>

          <!-- 打卡任务列表 -->
          <v-list>
            <v-list-item
              v-for="task in checkInTasks"
              :key="task.id"
            >
              <v-list-item-content>
                <v-list-item-title>{{ task.taskName }}</v-list-item-title>
                <v-list-item-subtitle>
                  今日已打卡: {{ task.todayCount || 0 }} 人
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  color="primary"
                  small
                  @click="checkIn(task.id)"
                  :disabled="task.hasCheckedToday"
                >
                  {{ task.hasCheckedToday ? '已打卡' : '打卡' }}
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default {
  name: 'CommunityView',
  data() {
    return {
      community: {},
      members: [],
      messages: [],
      newMessage: '',
      loading: false,
      onlineCount: 0,
      currentUserId: null,
      userRole: 'MEMBER', // OWNER, ADMIN, MEMBER
      isBanned: false,
      
      // WebSocket
      stompClient: null,
      isConnected: false,
      
      // 对话框
      manageDialog: false,
      checkInDialog: false,
      
      // 管理功能
      pendingApplications: [],
      
      // 打卡功能
      checkInTasks: [],
      newTaskName: '',
      
      // 默认头像
      defaultAvatar: 'https://cdn.vuetifyjs.com/images/avatars/avatar-10.png'
    };
  },
  
  computed: {
    communityId() {
      return this.$route.params.id;
    },
    isOwner() {
      return this.userRole === 'OWNER';
    },
    isAdmin() {
      return this.userRole === 'ADMIN' || this.userRole === 'OWNER';
    }
  },
  
  async created() {
    await this.fetchCommunityInfo();
    await this.fetchMembers();
    await this.loadChatHistory();
    this.getCurrentUser();
    this.connectWebSocket();
    this.fetchOnlineCount();
    
    if (this.isAdmin) {
      this.fetchPendingApplications();
    }
    this.fetchCheckInTasks();
  },
  
  beforeDestroy() {
    this.disconnectWebSocket();
  },
  
  methods: {
    // 获取社群信息
    async fetchCommunityInfo() {
      try {
        const response = await this.$axios.get(`/api/community/${this.communityId}`);
        this.community = response.data;
      } catch (error) {
        console.error('获取社群信息失败:', error);
        this.$router.push('/');
      }
    },
    
    // 获取成员列表
    async fetchMembers() {
      try {
        const response = await this.$axios.get(`/api/community/members/${this.communityId}`);
        this.members = response.data;
      } catch (error) {
        console.error('获取成员列表失败:', error);
      }
    },
    
    // 获取当前用户信息
    async getCurrentUser() {
      try {
        const response = await this.$axios.get('/api/users/me');
        this.currentUserId = response.data.id;
        
        // 获取用户在当前社群的角色
        const member = this.members.find(m => m.id === this.currentUserId);
        if (member) {
          this.userRole = member.role;
          this.isBanned = member.isBanned;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    },
    
    // 连接WebSocket
    connectWebSocket() {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const socket = new SockJS(`/ws-chat/websocket?userId=${this.currentUserId}&communityId=${this.communityId}`);
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        onConnect: () => {
          console.log('WebSocket连接成功');
          this.isConnected = true;
          
          // 订阅群聊消息
          this.stompClient.subscribe(`/topic/chat/${this.communityId}`, (message) => {
            const chatMessage = JSON.parse(message.body);
            this.messages.push(chatMessage);
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          });
        },
        onDisconnect: () => {
          console.log('WebSocket连接断开');
          this.isConnected = false;
        },
        onStompError: (frame) => {
          console.error('STOMP错误:', frame);
        }
      });
      
      this.stompClient.activate();
    },
    
    // 断开WebSocket连接
    disconnectWebSocket() {
      if (this.stompClient && this.isConnected) {
        this.stompClient.deactivate();
      }
    },
    
    // 发送消息
    sendMessage() {
      if (!this.newMessage.trim() || !this.isConnected || this.isBanned) return;
      
      const message = {
        senderId: this.currentUserId,
        content: this.newMessage.trim()
      };
      
      this.stompClient.publish({
        destination: `/app/chat/${this.communityId}`,
        body: JSON.stringify(message)
      });
      
      this.newMessage = '';
    },
    
    // 加载聊天历史
    async loadChatHistory() {
      this.loading = true;
      try {
        const response = await this.$axios.get('/api/chat/history', {
          params: {
            communityId: this.communityId,
            page: 1,
            size: 50
          }
        });
        this.messages = response.data.records || [];
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        console.error('加载聊天历史失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 滚动到底部
    scrollToBottom() {
      const container = this.$refs.chatContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    
    // 获取在线人数
    async fetchOnlineCount() {
      try {
        const response = await this.$axios.get('/api/chat/online/count', {
          params: { communityId: this.communityId }
        });
        this.onlineCount = response.data;
      } catch (error) {
        console.error('获取在线人数失败:', error);
      }
    },
    
    // 格式化时间
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    },
    
    // 格式化社群类型
    formatCommunityType(type) {
      const typeMap = {
        'study': '学习',
        'work': '工作',
        'hobby': '兴趣',
        'tech': '技术',
        'life': '生活',
        'other': '其他'
      };
      return typeMap[type] || type;
    },
    
    // 退出社群
    async leaveCommunity() {
      if (!confirm('确定要退出这个社群吗？')) return;
      
      try {
        await this.$axios.post('/api/community/applications/leave', null, {
          params: { communityId: this.communityId }
        });
        alert('已退出社群');
        this.$router.push('/');
      } catch (error) {
        console.error('退出社群失败:', error);
        alert('退出失败，请重试');
      }
    },
    
    // 获取待审核申请
    async fetchPendingApplications() {
      try {
        const response = await this.$axios.get('/api/community/applications/pending', {
          params: { communityId: this.communityId }
        });
        this.pendingApplications = response.data;
      } catch (error) {
        console.error('获取待审核申请失败:', error);
      }
    },
    
    // 审核申请
    async reviewApplication(applicationId, status) {
      try {
        await this.$axios.post('/api/community/applications/review', null, {
          params: { applicationId, status }
        });
        alert(status === 'APPROVED' ? '已同意申请' : '已拒绝申请');
        this.fetchPendingApplications();
        this.fetchMembers();
      } catch (error) {
        console.error('审核申请失败:', error);
        alert('操作失败，请重试');
      }
    },
    
    // 设置管理员
    async setAdmin(userId) {
      try {
        await this.$axios.post('/api/community/applications/setAdmin', null, {
          params: { communityId: this.communityId, userId }
        });
        alert('已设置为管理员');
        this.fetchMembers();
      } catch (error) {
        console.error('设置管理员失败:', error);
        alert('操作失败，请重试');
      }
    },
    
    // 取消管理员
    async cancelAdmin(userId) {
      try {
        await this.$axios.post('/api/community/applications/cancelAdmins', null, {
          params: { communityId: this.communityId, userId }
        });
        alert('已取消管理员');
        this.fetchMembers();
      } catch (error) {
        console.error('取消管理员失败:', error);
        alert('操作失败，请重试');
      }
    },
    
    // 禁言成员
    async banMember(userId) {
      try {
        await this.$axios.post('/api/community/applications/setBans', null, {
          params: { communityId: this.communityId, userId }
        });
        alert('已禁言该成员');
        this.fetchMembers();
      } catch (error) {
        console.error('禁言失败:', error);
        alert('操作失败，请重试');
      }
    },
    
    // 解除禁言
    async unbanMember(userId) {
      try {
        await this.$axios.post('/api/community/applications/cancelBans', null, {
          params: { communityId: this.communityId, userId }
        });
        alert('已解除禁言');
        this.fetchMembers();
      } catch (error) {
        console.error('解除禁言失败:', error);
        alert('操作失败，请重试');
      }
    },
    
    // 踢出成员
    async removeMember(userId) {
      if (!confirm('确定要踢出这个成员吗？')) return;
      
      try {
        await this.$axios.post('/api/community/applications/deleteMebers', null, {
          params: { communityId: this.communityId, userId }
        });
        alert('已踢出该成员');
        this.fetchMembers();
      } catch (error) {
        console.error('踢出成员失败:', error);
        alert('操作失败，请重试');
      }
    },
    
    // 获取打卡任务
    async fetchCheckInTasks() {
      try {
        // 这里需要根据实际API调整
        const response = await this.$axios.get('/api/check-in/tasks', {
          params: { communityId: this.communityId }
        });
        this.checkInTasks = response.data;
      } catch (error) {
        console.error('获取打卡任务失败:', error);
      }
    },
    
    // 创建打卡任务
    async createCheckInTask() {
      if (!this.newTaskName.trim()) return;
      
      try {
        await this.$axios.post('/api/check-in/tasks', {
          communityId: this.communityId,
          taskName: this.newTaskName
        });
        alert('打卡任务创建成功');
        this.newTaskName = '';
        this.fetchCheckInTasks();
      } catch (error) {
        console.error('创建打卡任务失败:', error);
        alert('创建失败，请重试');
      }
    },
    
    // 执行打卡
    async checkIn(taskId) {
      try {
        await this.$axios.post(`/api/check-in/tasks/${taskId}/records`);
        alert('打卡成功！');
        this.fetchCheckInTasks();
      } catch (error) {
        console.error('打卡失败:', error);
        alert('打卡失败，请重试');
      }
    }
  }
};
</script>

<style scoped>
.border-right {
  border-right: 1px solid #e0e0e0;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.border-top {
  border-top: 1px solid #e0e0e0;
}

.message-bubble {
  max-width: 70%;
  word-wrap: break-word;
}

.own-message {
  background-color: #1976d2;
  color: white;
}

.other-message {
  background-color: white;
  border: 1px solid #e0e0e0;
}

.max-width-70 {
  max-width: 70%;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 