<template>
  <v-container fluid class="pa-0" style="height: 100vh;">
    <v-row no-gutters style="height: 100%;">
      <!-- 左侧：社群信息和成员列表 - 固定高度，独立滚动 -->
      <v-col cols="3" class="border-right">
        <v-card flat tile style="height: 100vh; display: flex; flex-direction: column;">
          <!-- 社群基本信息 - 固定区域 -->
          <v-card-title class="px-4 py-3 border-bottom flex-shrink-0">
            <div class="d-flex align-center w-100">
              <v-avatar size="50" class="mr-3">
                <v-img :src="community.avatarUrl || defaultAvatar"></v-img>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">{{ community.name || '加载中...' }}</div>
                <div class="text-caption text--secondary">
                  {{ community.memberCount || 0 }} 名成员
                </div>
              </div>
            </div>
          </v-card-title>

          <!-- 社群描述 - 固定区域 -->
          <v-card-text class="px-4 py-3 border-bottom flex-shrink-0">
            <div class="text-body-2 text--secondary">
              {{ community.description || '暂无描述' }}
            </div>
            <div class="mt-2" v-if="community.categoryName || community.type">
              <v-chip v-if="community.categoryName" small color="primary" outlined class="mr-1">
                {{ community.categoryName }}
              </v-chip>
              <v-chip v-if="community.type" small color="indigo" outlined>
                #{{ formatCommunityType(community.type) }}
              </v-chip>
            </div>
          </v-card-text>

          <!-- 功能按钮区 - 固定区域 -->
          <v-card-text class="px-4 py-2 border-bottom flex-shrink-0">
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

          <!-- 通知日志区域 - 固定区域 -->
          <div v-if="notifications.length > 0" class="pa-3 border-bottom flex-shrink-0">
            <v-subheader class="px-0 py-1">
              <v-icon small class="mr-1">mdi-bell</v-icon>
              通知消息
          </v-subheader>
            <div 
              class="notification-log" 
              style="max-height: 120px; overflow-y: auto; background-color: #fff8e1; border-radius: 4px; padding: 8px; font-size: 12px;"
            >
              <div 
                v-for="(notification, index) in notifications.slice(-5)" 
                :key="index"
                class="text-caption mb-1"
              >
                <span class="text--secondary">[{{ formatTime(notification.timestamp) }}]</span>
                {{ notification.content }}
              </div>
            </div>
          </div>

          <!-- 在线成员标题 - 优化显示 -->
          <v-subheader class="px-4 flex-shrink-0 d-flex align-center">
            <v-icon small class="mr-2 success--text">mdi-circle</v-icon>
            <span>在线成员 ({{ onlineCount }})</span>
            <v-spacer></v-spacer>
            <v-btn 
              icon 
              x-small 
              @click="fetchOnlineMembers" 
              title="刷新在线用户"
              :loading="loading"
            >
              <v-icon x-small>mdi-refresh</v-icon>
            </v-btn>
          </v-subheader>
          
          <!-- 成员列表 - 优化在线状态显示 -->
          <div class="flex-grow-1" style="overflow-y: auto;">
          <v-list dense class="py-0" v-if="Array.isArray(members) && members.length > 0">
            <v-list-item
              v-for="member in members"
              :key="member.id"
                class="px-4 py-2"
                :class="{ 'member-online': member.isOnline }"
            >
                <v-list-item-avatar size="36">
                <v-img :src="member.avatarUrl || defaultAvatar"></v-img>
                  <!-- 在线状态指示器 - 更明显的样式 -->
                  <v-badge
                    :color="member.isOnline ? 'success' : 'grey lighten-1'"
                    dot
                    offset-x="6"
                    offset-y="6"
                    :class="{ 'online-pulse': member.isOnline }"
                  ></v-badge>
              </v-list-item-avatar>
                
              <v-list-item-content>
                  <v-list-item-title class="text-body-2 d-flex align-center">
                    <span class="member-name" :class="{ 'member-name-online': member.isOnline }">
                      {{ member.username }}
                    </span>
                    
                    <!-- 先显示角色标签 -->
                  <v-chip
                    v-if="member.role === 'OWNER'"
                    x-small
                    color="red"
                    text-color="white"
                      class="ml-2"
                    >
                      <v-icon x-small left>mdi-crown</v-icon>
                      群主
                    </v-chip>
                  <v-chip
                    v-else-if="member.role === 'ADMIN'"
                    x-small
                    color="orange"
                      text-color="white"
                      class="ml-2"
                    >
                      <v-icon x-small left>mdi-shield-account</v-icon>
                      管理员
                    </v-chip>
                    <v-chip
                      v-else
                      x-small
                      color="blue"
                      text-color="white"
                      class="ml-2"
                    >
                      <v-icon x-small left>mdi-account</v-icon>
                      成员
                    </v-chip>
                    
                    <!-- 在线标识放在身份标识右侧 -->
                    <v-chip
                      v-if="member.isOnline"
                      x-small
                      color="success"
                    text-color="white"
                    class="ml-1"
                    >
                      <v-icon x-small left>mdi-circle</v-icon>
                      在线
                    </v-chip>
                </v-list-item-title>
                  
                  <!-- 加入时间或在线时间 -->
                  <v-list-item-subtitle class="text-caption">
                    {{ member.isOnline ? '当前在线' : formatJoinTime(member.joinedAt) }}
                  </v-list-item-subtitle>
              </v-list-item-content>
                
                <!-- 操作按钮（仅管理员可见） -->
                <v-list-item-action v-if="isAdmin && member.role !== 'OWNER'">
                  <v-menu offset-y>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                  small
                        v-bind="attrs"
                        v-on="on"
                      >
                        <v-icon small>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list dense>
                      <v-list-item @click="promoteMember(member)" v-if="member.role === 'MEMBER' && isOwner">
                        <v-list-item-icon>
                          <v-icon small>mdi-arrow-up</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>提升为管理员</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="demoteMember(member)" v-if="member.role === 'ADMIN' && isOwner">
                        <v-list-item-icon>
                          <v-icon small>mdi-arrow-down</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>降为普通成员</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="banMember(member)">
                        <v-list-item-icon>
                          <v-icon small color="warning">mdi-account-remove</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>禁言成员</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="removeMember(member)" v-if="isOwner">
                        <v-list-item-icon>
                          <v-icon small color="error">mdi-account-minus</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>移除成员</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
              </v-list-item-action>
            </v-list-item>
          </v-list>
          
          <!-- 无成员时的提示 -->
          <div v-else class="text-center py-4 text--secondary">
              <v-icon large color="grey lighten-2">mdi-account-group</v-icon>
              <div class="mt-2">暂无成员信息</div>
              <v-btn small text color="primary" @click="fetchMembers" class="mt-2">
                <v-icon small left>mdi-refresh</v-icon>
                重新加载
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 右侧：聊天区域 - 完全独立的滚动区域 -->
      <v-col cols="9">
        <v-card flat tile style="height: 100vh; display: flex; flex-direction: column;">
          <!-- 聊天头部 - 固定区域 -->
          <v-card-title class="px-4 py-3 border-bottom flex-shrink-0">
            <v-icon class="mr-2">mdi-chat</v-icon>
            <span>群聊</span>
            <v-chip 
              small 
              :color="isConnected ? 'success' : 'error'" 
              class="ml-2"
            >
              {{ isConnected ? '已连接' : '未连接' }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn icon small @click="loadMoreHistory" :disabled="loading">
              <v-icon>{{ loading ? 'mdi-loading mdi-spin' : 'mdi-history' }}</v-icon>
            </v-btn>
            <v-btn icon small @click="loadChatHistory">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>

          <!-- 聊天消息区域 - 主要滚动区域 -->
          <div
            ref="chatContainer"
            class="flex-grow-1 chat-messages-container"
            @scroll="handleScroll"
          >
            <v-container fluid class="pa-3">
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            
              <!-- 优化的消息显示 - 更紧凑的布局 -->
              <div v-for="message in messages" :key="message.id || message.tempId" class="message-wrapper mb-2">
              <div
                :class="[
                  'd-flex',
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                ]"
              >
                  <!-- 其他用户的头像 -->
                  <v-avatar 
                    v-if="message.senderId !== currentUserId" 
                    size="32" 
                    class="mr-2 mt-1"
                  >
                    <v-img :src="getSenderAvatar(message.senderId)"></v-img>
                  </v-avatar>

                <div
                  :class="[
                      'message-bubble-compact',
                      'pa-0',
                    'rounded-lg',
                    'max-width-70',
                      message.senderId === currentUserId ? 'own-message-compact' : 'other-message-compact',
                      message.isHistory ? 'history-message' : 'new-message'
                    ]"
                  >
                    <!-- 消息头部：用户名和时间在同一行，固定间隙 -->
                    <div 
                      :class="[
                        'message-header-inline',
                        'px-2 pt-1 pb-0',
                        message.senderId === currentUserId ? 'text-right' : 'text-left'
                      ]"
                    >
                      <div class="d-flex align-center" :class="message.senderId === currentUserId ? 'justify-end' : 'justify-start'">
                        <span class="sender-name-compact font-weight-medium">
                          {{ getMessageSenderName(message) }}
                        </span>
                        
                        <!-- 固定间隙 -->
                        <span class="message-separator"></span>
                        
                        <span class="message-time-compact text-caption">
                    {{ formatTime(message.createdAt) }}
                        </span>
                        
                        <!-- 状态标签 -->
                        <v-chip 
                          v-if="message.isHistory" 
                          x-small 
                          color="grey" 
                          text-color="white" 
                          class="ml-1"
                        >
                          历史
                        </v-chip>
                        <v-chip 
                          v-if="message.isLocal" 
                          x-small 
                          color="orange" 
                          text-color="white" 
                          class="ml-1"
                        >
                          发送中
                        </v-chip>
                  </div>
                </div>

                    <!-- 消息内容 -->
                    <div class="message-content-compact px-2 pb-2">
                      <!-- 文本消息 -->
                      <div v-if="!message.messageType || message.messageType === 'text'" class="text-body-2">
                        {{ message.content }}
              </div>
                      
                      <!-- 图片消息 -->
                      <div v-else-if="message.messageType === 'image'">
                        <img 
                          :src="message.content" 
                          class="message-image-compact" 
                          @click="showImageModal(message.content)"
                          @error="handleImageError"
                        />
                      </div>
                      
                      <!-- 文件消息 -->
                      <div v-else-if="message.messageType === 'file'" class="file-message">
                        <div class="d-flex align-center pa-2" style="background: rgba(255,255,255,0.1); border-radius: 4px;">
                          <v-icon :color="getFileIconColor(getFileExtension(message.fileName))">
                            {{ getFileIcon(getFileExtension(message.fileName)) }}
                          </v-icon>
                          <div class="ml-2 flex-grow-1">
                            <div class="text-body-2 font-weight-medium">{{ message.fileName }}</div>
                            <div class="text-caption" :class="message.senderId === currentUserId ? 'white--text' : 'text--secondary'">
                              {{ formatFileSize(message.fileSize) }} • {{ getFileExtension(message.fileName).toUpperCase() }}
                            </div>
                          </div>
                          <v-btn
                            icon
                            small
                            @click="downloadFile(message.content, message.fileName)"
                            :color="message.senderId === currentUserId ? 'white' : 'primary'"
                          >
                            <v-icon small>mdi-download</v-icon>
                          </v-btn>
                        </div>
                      </div>
            </div>
          </div>

                  <!-- 自己的头像 -->
                  <v-avatar 
                    v-if="message.senderId === currentUserId" 
                    size="32" 
                    class="ml-2 mt-1"
                  >
                    <v-img :src="getSenderAvatar(message.senderId)"></v-img>
                  </v-avatar>
                </div>
              </div>
            </v-container>
          </div>

          <!-- 文件预览区域 - 支持多种文件类型 -->
          <div v-if="filePreview" class="flex-shrink-0 border-top pa-3">
            <div class="d-flex align-center">
              <!-- 图片预览 -->
              <div v-if="filePreview.type === 'image'" class="file-preview-container">
                <img 
                  :src="filePreview.url" 
                  style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid #ccc;"
                />
              </div>
              
              <!-- 文件预览 -->
              <div v-else class="file-preview-container d-flex align-center">
                <v-icon large :color="getFileIconColor(filePreview.extension)">
                  {{ getFileIcon(filePreview.extension) }}
                </v-icon>
                <div class="ml-3">
                  <div class="text-body-2 font-weight-medium">{{ filePreview.name }}</div>
                  <div class="text-caption text--secondary">
                    {{ formatFileSize(filePreview.size) }} • {{ filePreview.extension.toUpperCase() }}
                  </div>
                </div>
              </div>
              
              <v-spacer></v-spacer>
              <v-btn small text @click="cancelFileUpload">
                <v-icon small>mdi-close</v-icon>
                取消
              </v-btn>
            </div>
          </div>

          <!-- 消息输入区域 - 修改上传按钮 -->
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
                    :disabled="isBanned || !isConnected"
                  ></v-text-field>
                </v-col>
                <v-col cols="auto" class="ml-2">
                  <!-- 通用文件上传按钮 -->
                  <input
                    ref="fileInput"
                    type="file"
                    style="display: none"
                    @change="handleFileSelect"
                  />
                  <v-btn
                    icon
                    @click="$refs.fileInput.click()"
                    :disabled="isBanned || !isConnected"
                    class="mr-1"
                    title="上传文件（最大10MB）"
                  >
                    <v-icon>mdi-attachment</v-icon>
                  </v-btn>
                  
                  <!-- 发送按钮 -->
                  <v-btn
                    color="primary"
                    @click="sendMessage"
                    :disabled="(!newMessage.trim() && !filePreview) || isBanned || !isConnected"
                  >
                    <v-icon>{{ filePreview ? 'mdi-file-send' : 'mdi-send' }}</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
              <div v-if="isBanned" class="text-caption text--error mt-1">
                您已被禁言，无法发送消息
              </div>
              <div v-else-if="!isConnected" class="text-caption text--warning mt-1">
                网络连接断开，请稍后重试
              </div>
            </v-card-text>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 图片放大预览对话框 -->
    <v-dialog v-model="imageModal" max-width="90vw">
      <v-card>
        <v-card-text class="pa-0 text-center">
          <img 
            :src="modalImageSrc" 
            style="max-width: 100%; max-height: 80vh;"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="imageModal = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 打卡任务对话框 -->
    <v-dialog v-model="checkInDialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title>
          <span class="text-h5">打卡任务</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="checkInDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="text-center py-4 text--secondary">
            打卡功能开发中...
          </div>
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
      community: {
        id: null,
        name: '',
        description: '',
        avatarUrl: '',
        categoryName: '',
        type: '',
        memberCount: 0
      },
      members: [],
      messages: [],
      newMessage: '',
      loading: false,
      onlineCount: 0,
      currentUserId: null,
      userRole: 'MEMBER',
      isBanned: false,
      
      // WebSocket相关
      stompClient: null,
      isConnected: false,
      
      // 聊天增强功能
      currentPage: 1,
      pageSize: 20,
      hasMoreHistory: true,
      notifications: [],
      
      // 文件功能（替换原来的图片功能）
      filePreview: null,
      selectedFile: null,
      imageModal: false,
      modalImageSrc: '',
      
      // 文件大小限制（10MB）
      maxFileSize: 10 * 1024 * 1024,
      
      // 对话框
      manageDialog: false,
      checkInDialog: false,
      
      // 管理功能
      pendingApplications: [],
      
      // 打卡功能
      checkInTasks: [],
      newTask: {
        taskName: '',
        taskDescription: '',
        periodType: 'DAILY'
      },
      
      // 默认头像
      defaultAvatar: 'https://cdn.vuetifyjs.com/images/avatars/avatar-10.png',
      
      // 连接状态监控
      isConnecting: false,
      
      // ==================== 打卡功能数据 ====================
      // 打卡任务相关
      checkInTab: 0, // 打卡对话框当前标签页
      checkInLoading: false, // 打卡数据加载状态
      
      // 我的打卡记录
      selectedTaskId: null, // 当前选中的任务ID
      selectedTask: null, // 当前选中的任务对象
      myCheckInRecords: [], // 我的打卡记录
      
      // 排行榜相关
      selectedLeaderboardTaskId: null, // 排行榜选中的任务ID
      leaderboardType: 'monthly', // 排行榜类型
      leaderboard: [], // 排行榜数据
      leaderboardLoading: false, // 排行榜加载状态
      leaderboardTypes: [
        { text: '日榜', value: 'daily' },
        { text: '周榜', value: 'weekly' },
        { text: '月榜', value: 'monthly' }
      ],
      
      // 打卡表单相关
      checkInFormDialog: false, // 打卡表单对话框
      currentCheckInTask: null, // 当前打卡的任务
      checkInNotes: '', // 打卡笔记
      checkInSubmitting: false, // 打卡提交状态
      
      // 任务管理相关
      taskFormDialog: false, // 任务表单对话框
      editingTask: null, // 正在编辑的任务
      taskForm: { // 任务表单数据
        taskName: '',
        taskDescription: '',
        periodType: 'DAILY',
        startDate: ''
      },
      taskFormValid: false, // 任务表单验证状态
      taskSubmitting: false, // 任务提交状态
      
      // 配置数据
      periodTypes: [
        { text: '每日打卡', value: 'DAILY' },
        { text: '每周打卡', value: 'WEEKLY' }
      ],
      taskManageHeaders: [
        { text: '任务名称', value: 'taskName' },
        { text: '周期', value: 'periodType' },
        { text: '开始日期', value: 'startDate' },
        { text: '状态', value: 'status' },
        { text: '操作', value: 'actions', sortable: false }
      ],
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
    console.log('🏠 当前社群ID:', this.communityId);
    try {
      console.log('📡 开始初始化页面...');
      
      await this.fetchCommunityInfo();
      console.log('✅ 社群信息加载完成');
      
      await this.fetchMembers();
      console.log('✅ 成员列表加载完成，成员数量:', this.members.length);
      
      await this.getCurrentUser();
      console.log('✅ 用户信息加载完成，用户ID:', this.currentUserId);
      
      await this.loadChatHistory();
      console.log('✅ 聊天历史加载完成');
      
      // 获取在线用户状态
      await this.fetchOnlineMembers();
      console.log('✅ 在线用户状态加载完成');
      
      // 加载打卡任务 - 新增
      await this.fetchCheckInTasks();
      console.log('✅ 打卡任务加载完成');
      
      // 确保用户信息加载完成后再连接WebSocket
      if (this.currentUserId) {
        console.log('👤 用户信息已加载，开始连接WebSocket...');
        console.log('🔧 连接参数 - 用户ID:', this.currentUserId, '社群ID:', this.communityId);
        this.connectWebSocket();
      } else {
        console.error('❌ 用户信息未加载，跳过WebSocket连接');
        console.log('🔍 调试信息 - currentUserId:', this.currentUserId);
      }
      
      if (this.isAdmin) {
        console.log('👑 用户是管理员，获取待审核申请');
        this.fetchPendingApplications();
      }
      
      console.log('✅ 页面初始化完成');
      
      // 定时任务
      setInterval(() => {
        this.checkRealConnectionStatus();
      }, 30000);
      
      setInterval(() => {
        if (this.isConnected) {
          console.log('🔄 定时刷新在线用户列表...');
          this.fetchOnlineMembers();
        }
      }, 120000);
      
    } catch (error) {
      console.error('❌ 页面初始化失败:', error);
    }
  },
  
  beforeDestroy() {
    this.disconnectWebSocket();
  },
  
  methods: {
    // 连接WebSocket - 添加更详细的状态监控
    connectWebSocket() {
      if (this.isConnecting) {
        console.log('🔄 WebSocket连接正在进行中，跳过重复连接');
        return;
      }
      
      if (!this.currentUserId) {
        console.error('❌ 无法连接WebSocket: 缺少用户ID');
        return;
      }
      
      const token = this.$axios.defaults.headers.common['Authorization'] || localStorage.getItem('token');
      if (!token) {
        console.error('❌ 无法连接WebSocket: 缺少token');
        return;
      }
      
      this.isConnecting = true;
      console.log('🚀 开始连接WebSocket...');
      
      try {
        // 先清理现有连接
        if (this.stompClient) {
          try {
            this.stompClient.deactivate();
          } catch (e) {
            console.log('清理旧连接时出错:', e.message);
          }
          this.stompClient = null;
        }
        
        const socketUrl = `http://localhost:8080/ws-chat?userId=${this.currentUserId}&communityId=${this.communityId}`;
        const socket = new SockJS(socketUrl);
        
        this.stompClient = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            Authorization: token
          },
          
          // 添加心跳
          heartbeatIncoming: 20000,
          heartbeatOutgoing: 20000,
          
          debug: (str) => {
            console.log('[STOMP]', str);
          },
          
          onConnect: (frame) => {
            console.log("✅ STOMP连接成功:", frame);
            this.isConnected = true;
            this.isConnecting = false;
            this.addNotification('WebSocket连接成功');
            
            // 订阅频道
            this.subscribeChannels();
          },
          
          onDisconnect: () => {
            console.log('❌ WebSocket连接断开');
            this.isConnected = false;
            this.isConnecting = false;
            this.addNotification('WebSocket连接断开');
            
            // 自动重连
            setTimeout(() => {
              if (!this.isConnected) {
                console.log('🔄 自动重连WebSocket...');
                this.connectWebSocket();
              }
            }, 3000);
          },
          
          onStompError: (frame) => {
            console.error('❌ STOMP错误:', frame);
            this.isConnected = false;
            this.isConnecting = false;
            this.addNotification('WebSocket连接错误');
            
            // 自动重连
            setTimeout(() => {
              if (!this.isConnected) {
                console.log('🔄 错误后重连WebSocket...');
                this.connectWebSocket();
              }
            }, 5000);
          },
          
          onWebSocketClose: (event) => {
            console.log('❌ WebSocket连接关闭:', event);
            this.isConnected = false;
            this.isConnecting = false;
          },
          
          onWebSocketError: (error) => {
            console.error('❌ WebSocket底层错误:', error);
            this.isConnected = false;
            this.isConnecting = false;
          }
        });
        
        this.stompClient.activate();
        
      } catch (error) {
        console.error('❌ WebSocket连接异常:', error);
        this.isConnected = false;
        this.isConnecting = false;
        this.addNotification('WebSocket连接异常');
      }
    },
    
    // 断开WebSocket连接
    disconnectWebSocket() {
      if (this.stompClient) {
        try {
          console.log('🔌 正在断开WebSocket连接...');
          this.stompClient.deactivate();
          console.log('✅ WebSocket连接已断开');
      } catch (error) {
          console.error('❌ 断开WebSocket连接时出错:', error);
        } finally {
          this.isConnected = false;
          this.stompClient = null;
        }
      }
    },
    
    // 发送消息（修改原来的 sendMessage）
    async sendMessage() {
      if (this.filePreview) {
        await this.sendFileMessage();
      } else if (this.newMessage.trim()) {
        await this.sendTextMessage();
      }
    },
    
    // 发送文本消息 - 添加严格的连接检查
    async sendTextMessage() {
      if (!this.newMessage.trim()) {
        return;
      }
      
      // 严格检查连接状态
      if (!this.isConnected || !this.stompClient || !this.stompClient.connected) {
        console.warn('⚠️ WebSocket未连接，尝试重新连接...');
        this.isConnected = false; // 强制更新状态
        this.connectWebSocket();
        
        // 提示用户
        this.addNotification('连接断开，正在重新连接...');
        return;
      }
      
      const messageContent = this.newMessage.trim();
      const now = new Date().toISOString();
      
      const message = {
        senderId: this.currentUserId,
        content: messageContent,
        messageType: "text",
        senderNickname: this.getCurrentUserNickname()
      };
      
      try {
        console.log('📤 发送文本消息:', message);
        
        // 立即添加到本地显示（乐观更新）
        const tempMessage = {
          ...message,
          id: `temp-${Date.now()}`,
          tempId: `temp-${Date.now()}`,
          createdAt: now,
          isHistory: false,
          senderNickname: '我',
          isLocal: true
        };
        
        this.messages.push(tempMessage);
            this.$nextTick(() => {
              this.scrollToBottom();
            });
        
        // 发送到服务器 - 添加错误捕获
        this.stompClient.publish({
          destination: `/app/chat/${this.communityId}`,
          body: JSON.stringify(message)
        });
        
        this.newMessage = '';
        console.log('✅ 文本消息发送成功');
        
      } catch (error) {
        console.error('❌ 发送消息失败:', error);
        
        // 特殊处理连接错误
        if (error.message && error.message.includes('no underlying STOMP connection')) {
          console.log('🔄 检测到连接断开，强制重连...');
          this.isConnected = false;
          this.connectWebSocket();
          this.addNotification('连接断开，正在重新连接...');
        } else {
          alert('发送消息失败，请重试');
        }
        
        // 移除失败的本地消息
        this.messages = this.messages.filter(msg => !msg.isLocal || msg.content !== messageContent);
      }
    },
    
    // 发送文件消息（替换原来的 sendImageMessage）
    async sendFileMessage() {
      // 严格检查连接状态
      if (!this.isConnected || !this.stompClient || !this.stompClient.connected) {
        console.warn('⚠️ WebSocket未连接，尝试重新连接...');
        this.isConnected = false;
        this.connectWebSocket();
        this.addNotification('连接断开，正在重新连接...');
        return;
      }
      
      if (!this.selectedFile) return;
      
      try {
        // 检查文件大小
        if (this.selectedFile.size > this.maxFileSize) {
          alert(`文件大小不能超过 ${this.formatFileSize(this.maxFileSize)}`);
          this.cancelFileUpload();
          return;
        }
        
        // 准备FormData
        const formData = new FormData();
        formData.append("file", this.selectedFile);
        
        // 上传文件（由拦截器自动添加Authorization头）
        const response = await this.$axios.post("/api/common/upload", formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.code === 1) {
          const fileUrl = response.data.data;
          const isImage = this.selectedFile.type.startsWith('image/');
          
          // 按照后端要求的消息格式
          const message = {
            senderId: parseInt(this.currentUserId),
            content: fileUrl,
            messageType: isImage ? "image" : "file",
            fileName: this.selectedFile.name,
            fileSize: this.selectedFile.size,
            senderNickname: this.getCurrentUserNickname()
          };
          
          console.log('📤 发送文件消息:', message);
          
          this.stompClient.publish({
            destination: `/app/chat/${this.communityId}`,
            body: JSON.stringify(message)
          });
          
          this.cancelFileUpload();
          console.log('✅ 文件消息发送成功');
          
        } else {
          alert("上传失败：" + response.data.msg);
        }
      } catch (error) {
        console.error("❌ 文件上传失败:", error);
        
        // 特殊处理连接错误
        if (error.message && error.message.includes('no underlying STOMP connection')) {
          console.log('🔄 检测到连接断开，强制重连...');
          this.isConnected = false;
          this.connectWebSocket();
          this.addNotification('连接断开，正在重新连接...');
        } else {
          alert("文件发送失败");
        }
      }
    },
    
    // 获取当前用户昵称
    getCurrentUserNickname() {
      const currentMember = this.members.find(m => m.id === this.currentUserId);
      return currentMember ? currentMember.username : '用户' + this.currentUserId;
    },
    
    // 添加新消息到聊天列表 - 确保时间顺序
    addNewMessage(message) {
      // 验证消息格式
      if (!message || !message.content) {
        console.warn('收到无效消息:', message);
        return;
      }
      
      console.log('📨 收到新消息:', message);
      
      // 如果是自己的消息，先移除对应的本地临时消息
      if (parseInt(message.senderId) === parseInt(this.currentUserId)) {
        const tempMsgIndex = this.messages.findIndex(msg => 
          msg.isLocal && 
          msg.content === message.content && 
          Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 10000
        );
        
        if (tempMsgIndex !== -1) {
          console.log('🔄 移除对应的本地临时消息');
          this.messages.splice(tempMsgIndex, 1);
        }
      }
      
      // 生成消息ID
      const messageId = message.id || `${message.senderId}-${Date.now()}`;
      
      // 检查重复
      if (this.messages.find(m => m.id === messageId && !m.isLocal)) {
        console.log('⚠️ 消息重复，跳过添加');
        return;
      }
      
      // 处理消息
      const processedMessage = {
        ...message,
        id: messageId,
        isHistory: false,
        createdAt: message.createdAt || new Date().toISOString(),
        senderNickname: message.senderNickname || message.senderName || this.getSenderNickname(message.senderId),
        isLocal: false
      };
      
      // 按时间顺序插入消息
      const messageTime = new Date(processedMessage.createdAt).getTime();
      let insertIndex = this.messages.length;
      
      // 从后往前查找正确的插入位置
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const existingTime = new Date(this.messages[i].createdAt).getTime();
        if (existingTime <= messageTime) {
          insertIndex = i + 1;
          break;
        }
      }
      
      // 插入消息
      this.messages.splice(insertIndex, 0, processedMessage);
      console.log('💬 新消息已按时间顺序插入:', processedMessage, '位置:', insertIndex);
      
      // 如果是最新消息，滚动到底部
      if (insertIndex === this.messages.length - 1) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    
    // 根据发送者ID获取昵称
    getSenderNickname(senderId) {
      if (senderId === this.currentUserId) {
        return '我';
      }
      
      if (this.members && Array.isArray(this.members)) {
        const member = this.members.find(m => m.id === senderId);
        if (member && member.username) {
          return member.username;
        }
      }
      
      return `用户${senderId}`;
    },
    
    // 加载聊天历史 - 添加时间排序
    async loadChatHistory() {
      this.loading = true;
      this.currentPage = 1;
      try {
        const response = await this.$axios.get('/api/chat/history', {
          params: {
            communityId: this.communityId,
            page: this.currentPage,
            size: this.pageSize
          }
        });
        
        if (response.data.code === 1) {
          const historyMessages = response.data.data || [];
          
          // 处理历史消息并按时间排序
          const processedMessages = historyMessages.map(msg => ({
            ...msg,
            isHistory: true,
            // 确保昵称字段存在
            senderNickname: msg.senderNickname || msg.senderName || `用户${msg.senderId}`,
            // 确保时间字段格式正确
            createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
          }));
          
          // 按创建时间升序排序（最早的消息在前面）
          processedMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeA - timeB;
          });
          
          this.messages = processedMessages;
          console.log('📖 聊天历史加载完成，消息数量:', this.messages.length);
          console.log('📝 消息时间范围:', 
            this.messages.length > 0 ? 
            `${this.formatTime(this.messages[0].createdAt)} ~ ${this.formatTime(this.messages[this.messages.length - 1].createdAt)}` : 
            '无消息'
          );
          
        this.$nextTick(() => {
          this.scrollToBottom();
        });
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 加载更多历史消息 - 优化排序逻辑
    async loadMoreHistory() {
      if (this.loading || !this.hasMoreHistory) return;
      
      this.loading = true;
      try {
        const response = await this.$axios.get('/api/chat/history', {
          params: {
            communityId: this.communityId,
            page: this.currentPage + 1,
            size: this.pageSize
          }
        });
        
        if (response.data.code === 1) {
          const historyMessages = response.data.data || [];
          if (historyMessages.length === 0) {
            this.hasMoreHistory = false;
            return;
          }
          
          const oldScrollHeight = this.$refs.chatContainer.scrollHeight;
          
          // 处理历史消息昵称和时间
          const processedMessages = historyMessages.map(msg => ({
            ...msg,
            isHistory: true,
            senderNickname: msg.senderNickname || msg.senderName || `用户${msg.senderId}`,
            createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
          }));
          
          // 合并消息并重新排序
          const allMessages = [...processedMessages, ...this.messages];
          
          // 按创建时间升序排序，并去重
          const uniqueMessages = allMessages.reduce((acc, current) => {
            const existingIndex = acc.findIndex(msg => 
              msg.id === current.id || 
              (msg.senderId === current.senderId && 
               msg.content === current.content && 
               Math.abs(new Date(msg.createdAt) - new Date(current.createdAt)) < 1000)
            );
            
            if (existingIndex === -1) {
              acc.push(current);
            }
            return acc;
          }, []);
          
          // 按时间排序
          uniqueMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeA - timeB;
          });
          
          this.messages = uniqueMessages;
          this.currentPage++;
          
          console.log('📖 加载更多历史消息:', processedMessages.length, '总消息数:', this.messages.length);
          
          this.$nextTick(() => {
            const newScrollHeight = this.$refs.chatContainer.scrollHeight;
            this.$refs.chatContainer.scrollTop = newScrollHeight - oldScrollHeight;
          });
        }
      } catch (error) {
        console.error('加载更多历史消息失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 处理滚动事件
    handleScroll() {
      const container = this.$refs.chatContainer;
      if (container && container.scrollTop === 0 && this.hasMoreHistory && !this.loading) {
        this.loadMoreHistory();
      }
    },
    
    // 处理文件选择（替换原来的 handleImageSelect）
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 检查文件大小
      if (file.size > this.maxFileSize) {
        alert(`文件大小不能超过 ${this.formatFileSize(this.maxFileSize)}`);
        this.cancelFileUpload();
        return;
      }
      
      this.selectedFile = file;
      const extension = this.getFileExtension(file.name);
      
      // 创建文件预览对象
      this.filePreview = {
        name: file.name,
        size: file.size,
        extension: extension,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      };
      
      // 如果是图片，创建预览URL
      if (this.filePreview.type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.filePreview.url = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    
    // 取消文件上传（替换原来的 cancelImageUpload）
    cancelFileUpload() {
      this.filePreview = null;
      this.selectedFile = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    // 显示图片放大预览
    showImageModal(imageSrc) {
      this.modalImageSrc = imageSrc;
      this.imageModal = true;
    },
    
    // 处理图片加载错误
    handleImageError(event) {
      event.target.style.display = 'none';
    },
    
    // 添加通知消息
    addNotification(message) {
      this.notifications.push({
        content: message,
        timestamp: new Date()
      });
      
      if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(-50);
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
        console.log('🔍 通过在线用户列表获取在线人数...');
        const onlineUsers = await this.fetchOnlineMembers();
        // 在线人数已在fetchOnlineMembers中更新
        return onlineUsers.length;
      } catch (error) {
        console.error('❌ 获取在线人数失败:', error);
        this.onlineCount = 0;
        return 0;
      }
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (messageDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return date.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
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
    
    // 获取社群信息
    async fetchCommunityInfo() {
      try {
        const response = await this.$axios.get(`/api/community/${this.communityId}`);
        if (response.data && response.data.code === 1 && response.data.data) {
          const communityData = response.data.data;
          this.community = {
            id: communityData.id || null,
            name: communityData.name || '',
            description: communityData.description || '',
            avatarUrl: communityData.avatarUrl || '',
            categoryName: communityData.categoryName || '',
            type: communityData.type || '',
            memberCount: communityData.memberCount || 0,
            ownerId: communityData.ownerId || null,
            status: communityData.status || 1,
            categoryId: communityData.categoryId || null,
            createdAt: communityData.createdAt || null,
            updatedAt: communityData.updatedAt || null,
            ...communityData
          };
          console.log('✅ 解析后的社群信息:', this.community);
        } else {
          console.error('❌ API响应格式异常:', response.data);
          throw new Error('API响应格式异常');
        }
      } catch (error) {
        console.error('获取社群信息失败:', error);
        alert('获取社群信息失败，可能社群不存在');
        this.$router.push('/FrontPage');
      }
    },
    
    // 获取成员列表 - 适配新接口格式
    async fetchMembers() {
      try {
        const response = await this.$axios.get(`/api/community/members/${this.communityId}`);
        console.log('原始成员数据:', response.data);
        
        if (response.data.code === 1 && Array.isArray(response.data.data)) {
          const membersList = response.data.data;
          
          // 处理成员数据，获取用户详细信息
          const processedMembers = await Promise.all(
            membersList.map(async (member) => {
              try {
                // 根据userId获取用户详细信息
                const userResponse = await this.$axios.get(`/api/users/${member.userId}`);
                const userInfo = userResponse.data.code === 1 ? userResponse.data.data : {};
                
                return {
                  id: member.id,
                  userId: member.userId,
                  communityId: member.communityId,
                  role: member.role.toUpperCase(), // 转换为大写以匹配现有逻辑
                  joinedAt: member.joinedAt,
                  // 用户详细信息
                  username: userInfo.username || `用户${member.userId}`,
                  avatarUrl: userInfo.avatarUrl || '',
                  email: userInfo.email || '',
                  // 在线状态（暂时设为false，后续可通过WebSocket更新）
                  isOnline: false
                };
              } catch (userError) {
                console.error(`获取用户${member.userId}信息失败:`, userError);
                // 如果获取用户信息失败，使用默认值
                return {
                  id: member.id,
                  userId: member.userId,
                  communityId: member.communityId,
                  role: member.role.toUpperCase(),
                  joinedAt: member.joinedAt,
                  username: `用户${member.userId}`,
                  avatarUrl: '',
                  email: '',
                  isOnline: false
                };
              }
            })
          );
          
          this.members = processedMembers;
          console.log('处理后的成员列表:', this.members);
        } else {
          console.warn('成员列表数据格式异常:', response.data);
          this.members = [];
        }
      } catch (error) {
        console.error('获取成员列表失败:', error);
        this.members = [];
      }
    },
    
    // 获取当前用户信息
    async getCurrentUser() {
      try {
        console.log('🔍 正在获取当前用户信息...');
        const response = await this.$axios.get('/api/users/me');
        console.log('📱 用户API响应:', response.data);
        
        // 修复：确保用户ID为数字类型
        if (response.data && response.data.code === 1 && response.data.data && response.data.data.userId) {
          const userData = response.data.data;
          this.currentUserId = parseInt(userData.userId); // 确保为数字类型
          console.log('✅ 当前用户ID (数字类型):', this.currentUserId, typeof this.currentUserId);
          console.log('👤 用户完整信息:', userData);
          
          if (Array.isArray(this.members) && this.members.length > 0) {
            const member = this.members.find(m => m.id === this.currentUserId);
            if (member) {
              this.userRole = member.role || 'MEMBER';
              this.isBanned = member.isBanned || false;
              console.log('👤 用户角色:', this.userRole, '是否被禁:', this.isBanned);
            } else {
              console.warn('⚠️ 在成员列表中未找到当前用户，可能还不是该社群成员');
              this.userRole = 'VISITOR';
              this.isBanned = false;
            }
          } else {
            console.warn('⚠️ 成员列表为空或不是数组，设置为访客角色');
            this.userRole = 'VISITOR';
            this.isBanned = false;
          }
        } else {
          console.error('❌ 用户API响应格式异常:', response.data);
          console.log('🔍 检查响应结构 - code:', response.data?.code, 'data:', response.data?.data);
        }
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error);
        this.currentUserId = null;
        this.userRole = 'MEMBER';
        this.isBanned = false;
      }
    },
    
    // 退出社群
    async leaveCommunity() {
      if (!confirm('确定要退出这个社群吗？')) return;
      
      try {
        await this.$axios.post('/api/community/applications/leave', null, {
          params: { communityId: this.communityId }
        });
        alert('已退出社群');
        this.$router.push('/FrontPage');
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
        this.pendingApplications = response.data || [];
      } catch (error) {
        console.error('获取待审核申请失败:', error);
        this.pendingApplications = [];
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
    
    // 获取打卡任务列表
    async fetchCheckInTasks() {
      this.checkInLoading = true;
      try {
        console.log('🔍 正在获取打卡任务列表...');
        const response = await this.$axios.get(`/api/check-in/communities/${this.communityId}/tasks`);
        
        if (response.data.code === 1) {
          this.checkInTasks = response.data.data || [];
          console.log('✅ 打卡任务列表获取成功:', this.checkInTasks.length, '个任务');
          
          // 获取每个任务的个人状态
          if (this.checkInTasks.length > 0) {
            await this.fetchMyTaskStatuses();
          }
        } else {
          console.error('❌ 获取打卡任务列表失败:', response.data.message);
          this.checkInTasks = [];
        }
      } catch (error) {
        console.error('❌ 获取打卡任务列表异常:', error);
        this.checkInTasks = [];
      } finally {
        this.checkInLoading = false;
      }
    },
    
    // 获取我的所有任务状态
    async fetchMyTaskStatuses() {
      if (this.checkInTasks.length === 0) return;
      
      try {
        console.log('🔍 正在获取个人任务状态...');
        const statusPromises = this.checkInTasks.map(async (task) => {
          try {
            const response = await this.$axios.get(`/api/check-in/tasks/${task.id}/my-status`);
            if (response.data.code === 1) {
              task.myStatus = response.data.data;
              console.log(`✅ 任务${task.id}状态获取成功:`, task.myStatus);
            } else {
              console.warn(`⚠️ 任务${task.id}状态获取失败:`, response.data.message);
              task.myStatus = null;
            }
          } catch (error) {
            console.error(`❌ 任务${task.id}状态获取异常:`, error);
            task.myStatus = null;
          }
        });
        
        await Promise.all(statusPromises);
        console.log('✅ 所有个人任务状态获取完成');
      } catch (error) {
        console.error('❌ 获取个人任务状态异常:', error);
      }
    },
    
    // 创建打卡任务
    async createCheckInTask(taskData) {
      this.taskSubmitting = true;
      try {
        console.log('📤 正在创建打卡任务:', taskData);
        const response = await this.$axios.post(`/api/check-in/communities/${this.communityId}/tasks`, taskData);
        
        if (response.data.code === 1) {
          console.log('✅ 打卡任务创建成功');
          alert('任务创建成功！');
          this.taskFormDialog = false;
          await this.fetchCheckInTasks(); // 重新加载任务列表
          return true;
        } else {
          console.error('❌ 打卡任务创建失败:', response.data.message);
          alert(response.data.message || '任务创建失败');
          return false;
        }
      } catch (error) {
        console.error('❌ 创建打卡任务异常:', error);
        alert('任务创建失败，请重试');
        return false;
      } finally {
        this.taskSubmitting = false;
      }
    },
    
    // 更新打卡任务
    async updateCheckInTask(taskId, taskData) {
      this.taskSubmitting = true;
      try {
        console.log('📤 正在更新打卡任务:', taskId, taskData);
        const response = await this.$axios.put(`/api/check-in/tasks/${taskId}`, taskData);
        
        if (response.data.code === 1) {
          console.log('✅ 打卡任务更新成功');
          alert('任务更新成功！');
          this.taskFormDialog = false;
          await this.fetchCheckInTasks(); // 重新加载任务列表
          return true;
        } else {
          console.error('❌ 打卡任务更新失败:', response.data.message);
          alert(response.data.message || '任务更新失败');
          return false;
        }
      } catch (error) {
        console.error('❌ 更新打卡任务异常:', error);
        alert('任务更新失败，请重试');
        return false;
      } finally {
        this.taskSubmitting = false;
      }
    },
    
    // 切换任务状态（启用/停用）
    async toggleTaskStatus(task) {
      try {
        const newStatus = task.status === 1 ? 0 : 1;
        const statusText = newStatus === 1 ? '启用' : '停用';
        
        if (!confirm(`确定要${statusText}任务"${task.taskName}"吗？`)) {
          return;
        }
        
        console.log(`📤 正在${statusText}任务:`, task.id);
        const response = await this.$axios.patch(`/api/check-in/tasks/${task.id}/status`, null, {
          params: { status: newStatus }
        });
        
        if (response.data.code === 1) {
          console.log(`✅ 任务${statusText}成功`);
          task.status = newStatus;
          alert(`任务已${statusText}！`);
        } else {
          console.error(`❌ 任务${statusText}失败:`, response.data.message);
          alert(response.data.message || `任务${statusText}失败`);
        }
      } catch (error) {
        console.error('❌ 切换任务状态异常:', error);
        alert('操作失败，请重试');
      }
    },
    
    // 删除打卡任务
    async deleteCheckInTask(task) {
      if (!confirm(`确定要删除任务"${task.taskName}"吗？\n\n⚠️ 此操作不可撤销，将同时删除所有相关的打卡记录！`)) {
        return;
      }
      
      try {
        console.log('📤 正在删除打卡任务:', task.id);
        const response = await this.$axios.delete(`/api/check-in/tasks/${task.id}`);
        
        if (response.data.code === 1) {
          console.log('✅ 打卡任务删除成功');
          alert('任务删除成功！');
          await this.fetchCheckInTasks(); // 重新加载任务列表
        } else {
          console.error('❌ 打卡任务删除失败:', response.data.message);
          alert(response.data.message || '任务删除失败');
        }
      } catch (error) {
        console.error('❌ 删除打卡任务异常:', error);
        alert('任务删除失败，请重试');
      }
    },
    
    // 获取消息发送者的昵称
    getMessageSenderName(message) {
      // 优先使用 senderNickname
      if (message.senderNickname) {
        return message.senderNickname;
      }
      
      // 其次使用 senderName 
      if (message.senderName) {
        return message.senderName;
      }
      
      // 从成员列表中查找
      if (this.members && Array.isArray(this.members)) {
        const member = this.members.find(m => m.id === message.senderId);
        if (member && member.username) {
          return member.username;
        }
      }
      
      // 判断是否是当前用户
      if (message.senderId === this.currentUserId) {
        return '我';
      }
      
      // 最后使用默认格式
      return `用户${message.senderId}`;
    },
    
    // 获取发送者头像（优化版本）
    getSenderAvatar(senderId) {
      if (this.members && Array.isArray(this.members)) {
        const member = this.members.find(m => m.userId === senderId);
        if (member && member.avatarUrl) {
          return member.avatarUrl;
        }
      }
      return this.defaultAvatar;
    },
    
    // 验证和标准化消息时间
    normalizeMessageTime(timestamp) {
      if (!timestamp) {
        return new Date().toISOString();
      }
      
      // 尝试解析不同格式的时间
      let date;
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = new Date();
      }
      
      // 验证日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('无效的时间戳:', timestamp, '使用当前时间');
        date = new Date();
      }
      
      return date.toISOString();
    },
    
    // 消息排序函数
    sortMessagesByTime(messages) {
      return messages.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeA - timeB;
      });
    },
    
    // 去除重复消息
    removeDuplicateMessages(messages) {
      const seen = new Set();
      return messages.filter(msg => {
        const key = `${msg.senderId}-${msg.content}-${new Date(msg.createdAt).getTime()}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    },
    
    // 获取文件扩展名
    getFileExtension(fileName) {
      if (!fileName) return '';
      const lastDot = fileName.lastIndexOf('.');
      return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
    },
    
    // 获取文件图标
    getFileIcon(extension) {
      const iconMap = {
        // 图片
        'jpg': 'mdi-file-image',
        'jpeg': 'mdi-file-image',
        'png': 'mdi-file-image',
        'gif': 'mdi-file-image',
        'webp': 'mdi-file-image',
        'svg': 'mdi-file-image',
        
        // 文档
        'pdf': 'mdi-file-pdf',
        'doc': 'mdi-file-word',
        'docx': 'mdi-file-word',
        'xls': 'mdi-file-excel',
        'xlsx': 'mdi-file-excel',
        'ppt': 'mdi-file-powerpoint',
        'pptx': 'mdi-file-powerpoint',
        'txt': 'mdi-file-document',
        
        // 压缩包
        'zip': 'mdi-folder-zip',
        'rar': 'mdi-folder-zip',
        '7z': 'mdi-folder-zip',
        
        // 代码
        'js': 'mdi-language-javascript',
        'html': 'mdi-language-html5',
        'css': 'mdi-language-css3',
        'java': 'mdi-language-java',
        'py': 'mdi-language-python',
        'cpp': 'mdi-language-cpp',
        'c': 'mdi-language-c',
        
        // 视频
        'mp4': 'mdi-file-video',
        'avi': 'mdi-file-video',
        'mov': 'mdi-file-video',
        'wmv': 'mdi-file-video',
        
        // 音频
        'mp3': 'mdi-file-music',
        'wav': 'mdi-file-music',
        'flac': 'mdi-file-music',
        
        // 默认
        'default': 'mdi-file'
      };
      
      return iconMap[extension] || iconMap['default'];
    },
    
    // 获取文件图标颜色
    getFileIconColor(extension) {
      const colorMap = {
        'pdf': 'red',
        'doc': 'blue',
        'docx': 'blue',
        'xls': 'green',
        'xlsx': 'green',
        'ppt': 'orange',
        'pptx': 'orange',
        'zip': 'purple',
        'rar': 'purple',
        '7z': 'purple',
        'js': 'yellow darken-2',
        'html': 'orange',
        'css': 'blue',
        'java': 'red darken-2',
        'py': 'blue darken-2',
        'mp4': 'indigo',
        'mp3': 'green darken-2',
        'jpg': 'teal',
        'png': 'teal',
        'jpeg': 'teal',
        'gif': 'teal'
      };
      
      return colorMap[extension] || 'grey darken-1';
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    
    // 下载文件
    downloadFile(fileUrl, fileName) {
      try {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('下载文件失败:', error);
        // 如果下载失败，在新窗口打开
        window.open(fileUrl, '_blank');
      }
    },
    
    // 检查真实连接状态
    checkRealConnectionStatus() {
      const reallyConnected = this.stompClient && 
                             this.stompClient.connected && 
                             this.stompClient.active;
      
      if (this.isConnected !== reallyConnected) {
        console.log(`🔄 连接状态不同步，更新: ${this.isConnected} -> ${reallyConnected}`);
        this.isConnected = reallyConnected;
        
        if (!reallyConnected) {
          this.addNotification('检测到连接断开');
          this.connectWebSocket();
        }
      }
      
      return reallyConnected;
    },
    
    // 订阅频道方法 - 添加在线状态更新订阅
    subscribeChannels() {
      if (!this.stompClient || !this.stompClient.connected) {
        console.error('❌ 无法订阅频道：STOMP未连接');
        return;
      }
      
      try {
        // 订阅个人通知频道
        this.stompClient.subscribe(`/topic/notifications-${this.currentUserId}`, (msg) => {
          console.log("✅ 收到通知:", msg.body);
          try {
            const notice = JSON.parse(msg.body);
            this.addNotification(`[${notice.type}] ${notice.content}`);
      } catch (error) {
            console.error('解析通知消息失败:', error);
          }
        });
        
        // 订阅群聊消息频道
        this.stompClient.subscribe(`/topic/chat/${this.communityId}`, (msg) => {
          console.log("💬 收到群聊消息:", msg.body);
          try {
            const chatMessage = JSON.parse(msg.body);
            this.addNewMessage(chatMessage);
          } catch (error) {
            console.error('解析聊天消息失败:', error);
          }
        });
        
        // 订阅在线用户状态变化频道
        this.stompClient.subscribe(`/topic/online-status/${this.communityId}`, (msg) => {
          console.log("👥 收到在线状态变化:", msg.body);
          try {
            const statusUpdate = JSON.parse(msg.body);
            
            // 如果是在线状态更新消息
            if (statusUpdate.type === 'USER_ONLINE') {
              this.updateSingleUserOnlineStatus(statusUpdate.userId, true);
              this.onlineCount++;
              console.log(`👤 用户${statusUpdate.userId}上线，当前在线：${this.onlineCount}`);
            } 
            else if (statusUpdate.type === 'USER_OFFLINE') {
              this.updateSingleUserOnlineStatus(statusUpdate.userId, false);
              this.onlineCount = Math.max(0, this.onlineCount - 1);
              console.log(`👤 用户${statusUpdate.userId}下线，当前在线：${this.onlineCount}`);
            }
            else if (statusUpdate.type === 'ONLINE_COUNT_UPDATE') {
              // 如果是完整的在线人数更新
              this.onlineCount = statusUpdate.count || 0;
              this.fetchOnlineMembers(); // 重新获取完整的在线用户列表
            }
            
      } catch (error) {
            console.error('解析在线状态消息失败:', error);
            // 如果解析失败，重新获取在线用户列表
            this.fetchOnlineMembers();
          }
        });
        
        console.log(`📡 已订阅频道: /topic/chat/${this.communityId}、/topic/notifications-${this.currentUserId} 和 /topic/online-status/${this.communityId}`);
        
        // WebSocket连接成功后立即获取在线用户列表
        setTimeout(() => {
          this.fetchOnlineMembers();
        }, 1000);
        
      } catch (error) {
        console.error('❌ 订阅频道失败:', error);
        this.isConnected = false;
        setTimeout(() => this.connectWebSocket(), 2000);
      }
    },
    
    // 更新单个用户的在线状态
    updateSingleUserOnlineStatus(userId, isOnline) {
      const memberIndex = this.members.findIndex(m => m.userId === userId);
      if (memberIndex !== -1) {
        const oldStatus = this.members[memberIndex].isOnline;
        this.members[memberIndex].isOnline = isOnline;
        
        console.log(`👤 更新用户${userId}(${this.members[memberIndex].username})状态:`, 
          oldStatus ? '在线' : '离线', '→', isOnline ? '在线' : '离线');
      }
    },
    
    // 格式化加入时间
    formatJoinTime(timestamp) {
      if (!timestamp) return '未知时间';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        return '今天加入';
      } else if (days === 1) {
        return '昨天加入';
      } else if (days < 30) {
        return `${days}天前加入`;
      } else if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months}个月前加入`;
      } else {
        const years = Math.floor(days / 365);
        return `${years}年前加入`;
      }
    },
    
    // 提升成员为管理员
    async promoteMember(member) {
      if (!confirm(`确定要将 ${member.username} 提升为管理员吗？`)) return;
      
      try {
        await this.$axios.post('/api/community/members/promote', {
          communityId: this.communityId,
          userId: member.userId
        });
        
        // 更新本地数据
        const memberIndex = this.members.findIndex(m => m.id === member.id);
        if (memberIndex !== -1) {
          this.members[memberIndex].role = 'ADMIN';
        }
        
        this.$toast.success(`${member.username} 已提升为管理员`);
      } catch (error) {
        console.error('提升成员失败:', error);
        this.$toast.error('操作失败，请重试');
      }
    },
    
    // 降级管理员为普通成员
    async demoteMember(member) {
      if (!confirm(`确定要将管理员 ${member.username} 降为普通成员吗？`)) return;
      
      try {
        await this.$axios.post('/api/community/members/demote', {
          communityId: this.communityId,
          userId: member.userId
        });
        
        // 更新本地数据
        const memberIndex = this.members.findIndex(m => m.id === member.id);
        if (memberIndex !== -1) {
          this.members[memberIndex].role = 'MEMBER';
        }
        
        this.$toast.success(`${member.username} 已降为普通成员`);
      } catch (error) {
        console.error('降级成员失败:', error);
        this.$toast.error('操作失败，请重试');
      }
    },
    
    // 禁言成员
    async banMember(member) {
      const reason = prompt(`请输入禁言 ${member.username} 的原因:`);
      if (!reason) return;
      
      try {
        await this.$axios.post('/api/community/members/ban', {
          communityId: this.communityId,
          userId: member.userId,
          reason: reason
        });
        
        this.$toast.success(`${member.username} 已被禁言`);
      } catch (error) {
        console.error('禁言成员失败:', error);
        this.$toast.error('操作失败，请重试');
      }
    },
    
    // 移除成员
    async removeMember(member) {
      if (!confirm(`确定要将 ${member.username} 移除出社群吗？此操作不可撤销！`)) return;
      
      try {
        await this.$axios.delete(`/api/community/members/${member.id}`);
        
        // 从本地数据中移除
        this.members = this.members.filter(m => m.id !== member.id);
        
        this.$toast.success(`${member.username} 已被移除出社群`);
      } catch (error) {
        console.error('移除成员失败:', error);
        this.$toast.error('操作失败，请重试');
      }
    },
    
    // 更新成员在线状态（通过WebSocket）
    updateMemberOnlineStatus(userId, isOnline) {
      const memberIndex = this.members.findIndex(m => m.userId === userId);
      if (memberIndex !== -1) {
        this.members[memberIndex].isOnline = isOnline;
      }
    },
    
    // 获取在线用户列表 - 新增方法
    async fetchOnlineMembers() {
      try {
        console.log('🔍 正在获取在线用户列表...');
        const response = await this.$axios.get('/api/chat/online/members', {
          params: { communityId: this.communityId }
        });
        
        console.log('👥 在线用户API完整响应:', response.data);
        
        if (response.data.code === 1 && Array.isArray(response.data.data)) {
          const onlineUsers = response.data.data;
          console.log('👥 在线用户列表:', onlineUsers);
          
          // 更新成员的在线状态
          this.updateMembersOnlineStatus(onlineUsers);
          
          // 更新在线人数
          this.onlineCount = onlineUsers.length;
          console.log('📊 在线用户数量:', this.onlineCount);
          
          return onlineUsers;
        } else {
          console.warn('⚠️ 在线用户数据格式异常:', response.data);
          return [];
        }
      } catch (error) {
        console.error('❌ 获取在线用户列表失败:', error);
        return [];
      }
    },
    
    // 更新成员在线状态
    updateMembersOnlineStatus(onlineUsers) {
      if (!Array.isArray(this.members) || !Array.isArray(onlineUsers)) {
        console.warn('⚠️ 更新在线状态失败：数据格式错误');
        return;
      }
      
      // 创建在线用户ID集合，便于快速查找
      const onlineUserIds = new Set(onlineUsers.map(user => user.userId));
      console.log('🔍 在线用户ID集合:', Array.from(onlineUserIds));
      
      // 更新每个成员的在线状态
      this.members.forEach(member => {
        const wasOnline = member.isOnline;
        member.isOnline = onlineUserIds.has(member.userId);
        
        // 如果状态发生变化，记录日志
        if (wasOnline !== member.isOnline) {
          console.log(`👤 ${member.username} 状态变化:`, 
            wasOnline ? '在线→离线' : '离线→在线');
        }
      });
      
      console.log('✅ 成员在线状态更新完成');
    },
    
    // 执行打卡
    async submitCheckIn(taskId, notes = '') {
      this.checkInSubmitting = true;
      try {
        const data = notes.trim() ? { notes: notes.trim() } : {};
        
        console.log('📤 正在执行打卡:', taskId, data);
        const response = await this.$axios.post(`/api/check-in/tasks/${taskId}/check-in`, data);
        
        if (response.data.code === 1) {
          console.log('✅ 打卡成功');
          alert('打卡成功！继续保持哦 🎉');
          this.checkInFormDialog = false;
          this.checkInNotes = '';
          
          // 更新任务状态
          const task = this.checkInTasks.find(t => t.id === taskId);
          if (task && task.myStatus) {
            task.myStatus.todayCheckedIn = true;
            task.myStatus.currentStreak = (task.myStatus.currentStreak || 0) + 1;
            task.myStatus.totalDays = (task.myStatus.totalDays || 0) + 1;
            
            // 重新计算打卡率
            const startDate = new Date(task.startDate);
            const today = new Date();
            const totalDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
            task.myStatus.checkInRate = Math.round((task.myStatus.totalDays / totalDays) * 100);
          }
          
          // 如果当前在查看这个任务的记录，刷新记录
          if (this.selectedTaskId === taskId) {
            await this.loadMyCheckInRecords(taskId);
          }
          
          return true;
        } else {
          console.error('❌ 打卡失败:', response.data.message);
          alert(response.data.message || '打卡失败');
          return false;
        }
      } catch (error) {
        console.error('❌ 打卡异常:', error);
        alert('打卡失败，请重试');
        return false;
      } finally {
        this.checkInSubmitting = false;
      }
    },
    
    // 获取个人打卡记录
    async loadMyCheckInRecords(taskId, page = 1, size = 20) {
      if (!taskId) {
        console.warn('⚠️ 未指定任务ID，无法加载打卡记录');
        return;
      }
      
      try {
        console.log('🔍 正在获取个人打卡记录:', taskId);
        const response = await this.$axios.get(`/api/check-in/tasks/${taskId}/my-records`, {
          params: { page, size }
        });
        
        if (response.data.code === 1) {
          this.myCheckInRecords = response.data.data || [];
          this.selectedTask = this.checkInTasks.find(t => t.id === taskId);
          console.log('✅ 个人打卡记录获取成功:', this.myCheckInRecords.length, '条记录');
        } else {
          console.error('❌ 个人打卡记录获取失败:', response.data.message);
          this.myCheckInRecords = [];
        }
      } catch (error) {
        console.error('❌ 获取个人打卡记录异常:', error);
        this.myCheckInRecords = [];
      }
    },
    
    // 获取任务排行榜
    async loadTaskLeaderboard(taskId, type = 'monthly', limit = 50) {
      if (!taskId) {
        console.warn('⚠️ 未指定任务ID，无法加载排行榜');
        return;
      }
      
      this.leaderboardLoading = true;
      try {
        console.log('🔍 正在获取任务排行榜:', taskId, type);
        const response = await this.$axios.get(`/api/check-in/tasks/${taskId}/leaderboard`, {
          params: { type, limit }
        });
        
        if (response.data.code === 1) {
          this.leaderboard = response.data.data.leaderboard || [];
          console.log('✅ 任务排行榜获取成功:', this.leaderboard.length, '条记录');
        } else {
          console.error('❌ 任务排行榜获取失败:', response.data.message);
          this.leaderboard = [];
        }
      } catch (error) {
        console.error('❌ 获取任务排行榜异常:', error);
        this.leaderboard = [];
      } finally {
        this.leaderboardLoading = false;
      }
    },
    
    // 获取社群总排行榜
    async loadCommunityLeaderboard(type = 'monthly', limit = 50) {
      this.leaderboardLoading = true;
      try {
        console.log('🔍 正在获取社群总排行榜:', type);
        const response = await this.$axios.get(`/api/check-in/communities/${this.communityId}/leaderboard`, {
          params: { type, limit }
        });
        
        if (response.data.code === 1) {
          this.leaderboard = response.data.data.leaderboard || [];
          console.log('✅ 社群总排行榜获取成功:', this.leaderboard.length, '条记录');
        } else {
          console.error('❌ 社群总排行榜获取失败:', response.data.message);
          this.leaderboard = [];
        }
      } catch (error) {
        console.error('❌ 获取社群总排行榜异常:', error);
        this.leaderboard = [];
      } finally {
        this.leaderboardLoading = false;
      }
    },
    
    // 获取任务统计信息
    async getTaskStatistics(taskId) {
      try {
        console.log('🔍 正在获取任务统计信息:', taskId);
        const response = await this.$axios.get(`/api/check-in/tasks/${taskId}/statistics`);
        
        if (response.data.code === 1) {
          console.log('✅ 任务统计信息获取成功:', response.data.data);
          return response.data.data;
        } else {
          console.error('❌ 任务统计信息获取失败:', response.data.message);
          return null;
        }
      } catch (error) {
        console.error('❌ 获取任务统计信息异常:', error);
        return null;
      }
    },
    
    // 获取社群打卡概览
    async getCommunityOverview() {
      try {
        console.log('🔍 正在获取社群打卡概览...');
        const response = await this.$axios.get(`/api/check-in/communities/${this.communityId}/overview`);
        
        if (response.data.code === 1) {
          console.log('✅ 社群打卡概览获取成功:', response.data.data);
          return response.data.data;
        } else {
          console.error('❌ 社群打卡概览获取失败:', response.data.message);
          return null;
        }
      } catch (error) {
        console.error('❌ 获取社群打卡概览异常:', error);
        return null;
      }
    },
    
    // 显示打卡表单
    showCheckInForm(task) {
      this.currentCheckInTask = task;
      this.checkInNotes = '';
      this.checkInFormDialog = true;
    },
    
    // 查看任务详情
    viewTaskDetails(task) {
      this.selectedTaskId = task.id;
      this.selectedTask = task;
      this.checkInTab = 1; // 切换到我的打卡标签页
      this.loadMyCheckInRecords(task.id);
    },
    
    // 显示创建任务对话框
    showCreateTaskDialog() {
      this.editingTask = null;
      this.taskForm = {
        taskName: '',
        taskDescription: '',
        periodType: 'DAILY',
        startDate: new Date().toISOString().substr(0, 10)
      };
      this.taskFormDialog = true;
    },
    
    // 编辑任务
    editTask(task) {
      this.editingTask = task;
      this.taskForm = {
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        periodType: task.periodType,
        startDate: task.startDate
      };
      this.taskFormDialog = true;
    },
    
    // 提交任务表单
    async submitTaskForm() {
      if (!this.$refs.taskForm || !this.$refs.taskForm.validate()) {
        console.warn('⚠️ 表单验证失败');
        return;
      }
      
      if (this.editingTask) {
        await this.updateCheckInTask(this.editingTask.id, this.taskForm);
      } else {
        await this.createCheckInTask(this.taskForm);
      }
    },
    
    // 加载排行榜
    async loadLeaderboard() {
      if (this.selectedLeaderboardTaskId) {
        await this.loadTaskLeaderboard(this.selectedLeaderboardTaskId, this.leaderboardType);
      } else {
        await this.loadCommunityLeaderboard(this.leaderboardType);
      }
    },
    
    // 格式化打卡周期
    formatPeriodType(type) {
      const map = {
        'DAILY': '每日',
        'WEEKLY': '每周'
      };
      return map[type] || type;
    },
    
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    },
    
    // 获取任务状态颜色
    getTaskStatusColor(status) {
      return status === 1 ? 'success' : 'grey';
    },
    
    // 获取任务状态图标
    getTaskStatusIcon(status) {
      return status === 1 ? 'mdi-calendar-check' : 'mdi-calendar-remove';
    },
    
    // 获取排名颜色
    getRankColor(rank) {
      if (rank === 1) return 'yellow darken-2';
      if (rank === 2) return 'grey lighten-1';
      if (rank === 3) return 'orange darken-2';
      return 'primary';
    },
    
    // 获取选中任务名称
    getSelectedTaskName() {
      if (!this.selectedLeaderboardTaskId) return '社群总榜';
      const task = this.checkInTasks.find(t => t.id === this.selectedLeaderboardTaskId);
      return task ? task.taskName : '未知任务';
    },
    
    // 获取排行榜类型名称
    getLeaderboardTypeName() {
      const type = this.leaderboardTypes.find(t => t.value === this.leaderboardType);
      return type ? type.text.replace('榜', '') : '';
    },
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

/* 聊天消息容器 - 优化滚动 */
.chat-messages-container {
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

/* 自定义滚动条 */
.chat-messages-container::-webkit-scrollbar {
  width: 8px;
}

.chat-messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chat-messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.chat-messages-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 紧凑消息包装器 */
.message-wrapper {
  margin-bottom: 8px !important;
}

/* 紧凑的消息气泡 */
.message-bubble-compact {
  max-width: 70%;
  word-wrap: break-word;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  min-width: 120px;
}

/* 自己的消息样式 - Indigo色系 */
.own-message-compact {
  background: linear-gradient(135deg, #3f51b5 0%, #303f9f 100%);
  color: white;
}

.own-message-compact .message-header-inline {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px 8px 0 0;
}

.own-message-compact .sender-name-compact {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  flex-shrink: 0; /* 防止用户名被压缩 */
}

.own-message-compact .message-time-compact {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0; /* 防止时间被压缩 */
}

/* 其他人的消息样式 */
.other-message-compact {
  background: white;
  border: 1px solid #e0e0e0;
}

.other-message-compact .message-header-inline {
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e9ecef;
}

.other-message-compact .sender-name-compact {
  color: #495057;
  font-size: 12px;
  flex-shrink: 0; /* 防止用户名被压缩 */
}

.other-message-compact .message-time-compact {
  color: #6c757d;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0; /* 防止时间被压缩 */
}

/* 历史消息样式 */
.history-message {
  opacity: 0.85;
}

.history-message .message-bubble-compact {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* 新消息动画 */
.new-message {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from { 
    opacity: 0; 
    transform: translateY(15px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* 紧凑消息内容样式 */
.message-content-compact {
  line-height: 1.4;
}

/* 紧凑图片消息样式 */
.message-image-compact {
  max-width: 200px;
  max-height: 200px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.message-image-compact:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 最大宽度限制 */
.max-width-70 {
  max-width: 70%;
}

/* 通知日志样式 */
.notification-log {
  max-height: 120px;
  overflow-y: auto;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.notification-log::-webkit-scrollbar {
  width: 4px;
}

.notification-log::-webkit-scrollbar-thumb {
  background: #d7ccc8;
  border-radius: 2px;
}

/* 成员列表滚动优化 */
.v-list {
  background: transparent !important;
}

/* 头像悬浮效果 */
.v-avatar {
  transition: transform 0.2s ease;
}

.v-avatar:hover {
  transform: scale(1.05);
}

/* 紧凑消息气泡尖角效果 */
.own-message-compact::before {
  content: '';
  position: absolute;
  top: 12px;
  right: -6px;
  width: 0;
  height: 0;
  border-left: 6px solid #3f51b5;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.other-message-compact::before {
  content: '';
  position: absolute;
  top: 12px;
  left: -6px;
  width: 0;
  height: 0;
  border-right: 6px solid white;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

/* 内联头部样式 */
.message-header-inline {
  min-height: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-bubble-compact {
    max-width: 85%;
    min-width: 100px;
  }
  
  .message-image-compact {
    max-width: 150px;
    max-height: 150px;
  }
  
  .sender-name-compact {
    font-size: 11px !important;
  }
  
  .message-time-compact {
    font-size: 10px !important;
  }
  
  /* 在移动端减少间隙 */
  .message-separator {
    width: 12px;
  }
}

/* 连接状态芯片样式 */
.v-chip.v-size--small {
  font-weight: 600;
}

/* 角色标签样式 */
.v-chip.v-size--x-small {
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 紧凑布局下的chip样式 */
.message-header-inline .v-chip.v-size--x-small {
  height: 16px !important;
  font-size: 10px !important;
  flex-shrink: 0; /* 防止标签被压缩 */
}

/* 消息分隔符 - 固定间隙 */
.message-separator {
  width: 16px; /* 固定宽度间隙 */
  display: inline-block;
  flex-shrink: 0; /* 防止压缩 */
}

/* 文件消息样式 */
.file-message {
  min-width: 200px;
}

.file-preview-container {
  display: flex;
  align-items: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px dashed #ddd;
}

/* 文件下载按钮悬浮效果 */
.file-message .v-btn:hover {
  transform: scale(1.1);
}

/* 文件图标动画 */
.file-message .v-icon {
  transition: all 0.2s ease;
}

.file-message:hover .v-icon {
  transform: scale(1.1);
}

/* 响应式文件消息 */
@media (max-width: 768px) {
  .file-message {
    min-width: 150px;
  }
  
  .file-preview-container {
    padding: 6px;
  }
}

/* 成员列表优化样式 */
.member-name {
  font-weight: 500;
  color: #2c3e50;
}

/* 成员头像悬浮效果 */
.v-list-item:hover .v-avatar {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* 角色标签样式优化 */
.v-chip.v-size--x-small {
  font-weight: 500;
  letter-spacing: 0.5px;
  border-radius: 12px;
}

/* 在线状态徽章 */
.v-badge--dot .v-badge__badge {
  height: 8px;
  width: 8px;
  border: 2px solid white;
}

/* 成员操作菜单 */
.v-list-item__action {
  margin: 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .member-name {
    font-size: 13px;
  }
  
  .v-chip.v-size--x-small {
    font-size: 9px;
    height: 14px;
  }
}

/* 成员操作菜单 - 设置为不透明 */
.v-list-item__action {
  margin: 8px 0;
}

/* 三个点菜单按钮 - 完全不透明 */
.v-list-item__action .v-btn {
  opacity: 1 !important;
  background-color: rgba(0, 0, 0, 0.04) !important;
  transition: all 0.2s ease;
}

/* 悬浮时的效果 */
.v-list-item__action .v-btn:hover {
  opacity: 1 !important;
  background-color: rgba(0, 0, 0, 0.08) !important;
  transform: scale(1.05);
}

/* 菜单内容也设置为不透明 */
.v-menu__content {
  opacity: 1 !important;
  background-color: white !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 菜单列表项也设置为不透明 */
.v-menu__content .v-list {
  opacity: 1 !important;
  background-color: white !important;
}

.v-menu__content .v-list-item {
  opacity: 1 !important;
}

.v-menu__content .v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

/* 确保图标也是不透明的 */
.v-list-item__action .v-icon {
  opacity: 1 !important;
  color: #424242 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .member-name {
    font-size: 13px;
  }
  
  .v-chip.v-size--x-small {
    font-size: 9px;
    height: 14px;
  }
  
  /* 移动端菜单按钮也保持不透明 */
  .v-list-item__action .v-btn {
    opacity: 1 !important;
  }
}

/* 在线成员特殊样式 */
.member-online {
  background-color: rgba(76, 175, 80, 0.05) !important;
}

.member-name-online {
  color: #388e3c !important;
  font-weight: 600;
}

/* 在线状态脉冲动画 */
.online-pulse .v-badge__badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

/* 在线徽章增强样式 */
.v-badge--dot .v-badge__badge {
  height: 10px;
  width: 10px;
  border: 2px solid white;
}
</style> 