<template>
    <v-container fluid class="pa-0" style="height: 100vh;">
        <!-- 主要布局行容器：左侧显示社群信息和成员列表，右侧显示聊天区域，占满父容器高度且无列间距 -->
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
                        <v-btn v-if="isAdmin || isOwner" small color="primary" outlined block class="mb-2"
                            @click="manageDialog = true">
                            <v-icon left small>mdi-account-cog</v-icon>
                            成员管理
                        </v-btn>
                        <v-btn small color="success" outlined block class="mb-2" @click="checkInDialog = true">
                            <v-icon left small>mdi-calendar-check</v-icon>
                            打卡任务
                        </v-btn>
                        <v-btn v-if="!isOwner" small color="error" outlined block @click="leaveCommunity">
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
                        <div class="notification-log"
                            style="max-height: 120px; overflow-y: auto; background-color: #fff8e1; border-radius: 4px; padding: 8px; font-size: 12px;">
                            <div v-for="(notification, index) in notifications.slice(-5)" :key="index"
                                class="text-caption mb-1">
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
                        <v-btn icon x-small @click="fetchOnlineMembers" title="刷新在线用户" :loading="loading">
                            <v-icon x-small>mdi-refresh</v-icon>
                        </v-btn>
                    </v-subheader>

                    <!-- 成员列表 - 优化在线状态显示 -->
                    <div class="flex-grow-1" style="overflow-y: auto;">
                        <v-list dense class="py-0" v-if="Array.isArray(members) && members.length > 0">
                            <v-list-item v-for="member in members" :key="member.id" class="px-4 py-2"
                                :class="{ 'member-online': member.isOnline }">
                                <v-list-item-avatar size="36">
                                    <v-img :src="member.avatarUrl || defaultAvatar"></v-img>
                                    <!-- 在线状态指示器 - 更明显的样式 -->
                                    <v-badge :color="member.isOnline ? 'success' : 'grey lighten-1'" dot offset-x="6"
                                        offset-y="6" :class="{ 'online-pulse': member.isOnline }"></v-badge>
                                </v-list-item-avatar>

                                <v-list-item-content>
                                    <v-list-item-title class="text-body-2 d-flex align-center">
                                        <span class="member-name" :class="{ 'member-name-online': member.isOnline }">
                                            {{ member.username }}
                                        </span>

                                        <!-- 先显示角色标签 -->
                                        <v-chip v-if="member.role === 'OWNER'" x-small color="red" text-color="white"
                                            class="ml-2">
                                            <v-icon x-small left>mdi-crown</v-icon>
                                            群主
                                        </v-chip>
                                        <v-chip v-else-if="member.role === 'ADMIN'" x-small color="orange"
                                            text-color="white" class="ml-2">
                                            <v-icon x-small left>mdi-shield-account</v-icon>
                                            管理员
                                        </v-chip>
                                        <v-chip v-else x-small color="blue" text-color="white" class="ml-2">
                                            <v-icon x-small left>mdi-account</v-icon>
                                            成员
                                        </v-chip>

                                        <!-- 在线标识放在身份标识右侧 -->
                                        <v-chip v-if="member.isOnline" x-small color="success" text-color="white"
                                            class="ml-1">
                                            <v-icon x-small left>mdi-circle</v-icon>
                                            在线
                                        </v-chip>
                                        
                                        <!-- 禁言状态标识 -->
                                        <v-chip v-if="member.isBanned" x-small color="error" text-color="white"
                                            class="ml-1">
                                            <v-icon x-small left>mdi-account-remove</v-icon>
                                            已禁言
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
                                            <v-btn icon small v-bind="attrs" v-on="on">
                                                <v-icon small>mdi-dots-vertical</v-icon>
                                            </v-btn>
                                        </template>
                                        <v-list dense>
                                            <v-list-item @click="promoteMember(member)"
                                                v-if="member.role === 'MEMBER' && isOwner">
                                                <v-list-item-icon>
                                                    <v-icon small>mdi-arrow-up</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>提升为管理员</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="demoteMember(member)"
                                                v-if="member.role === 'ADMIN' && isOwner">
                                                <v-list-item-icon>
                                                    <v-icon small>mdi-arrow-down</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>降为普通成员</v-list-item-title>
                                            </v-list-item>
                                            <!-- 禁言/解禁选项 -->
                                            <v-list-item @click="banMember(member)" v-if="!member.isBanned">
                                                <v-list-item-icon>
                                                    <v-icon small color="warning">mdi-account-remove</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>禁言成员</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="unbanMember(member)" v-if="member.isBanned">
                                                <v-list-item-icon>
                                                    <v-icon small color="success">mdi-account-check</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-title>解除禁言</v-list-item-title>
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
                        <v-chip small :color="isConnected ? 'success' : 'error'" class="ml-2">
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
                    <div ref="chatContainer" class="flex-grow-1 chat-messages-container" @scroll="handleScroll">
                        <v-container fluid class="pa-3">
                            <div v-if="loading" class="text-center py-4">
                                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                            </div>

                            <!-- 优化的消息显示 - 更紧凑的布局 -->
                            <div v-for="message in messages" :key="message.id || message.tempId"
                                class="message-wrapper mb-2">
                                <div :class="[
                  'd-flex',
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                ]">
                                    <!-- 其他用户的头像 -->
                                    <v-avatar v-if="message.senderId !== currentUserId" size="32" class="mr-2 mt-1">
                                        <v-img :src="getSenderAvatar(message.senderId)"></v-img>
                                    </v-avatar>

                                    <div :class="[
                      'message-bubble-compact',
                      'pa-0',
                    'rounded-lg',
                    'max-width-70',
                      message.senderId === currentUserId ? 'own-message-compact' : 'other-message-compact',
                      message.isHistory ? 'history-message' : 'new-message'
                    ]">
                                        <!-- 消息头部：用户名和时间在同一行，固定间隙 -->
                                        <div :class="[
                        'message-header-inline',
                        'px-2 pt-1 pb-0',
                        message.senderId === currentUserId ? 'text-right' : 'text-left'
                      ]">
                                            <div class="d-flex align-center"
                                                :class="message.senderId === currentUserId ? 'justify-end' : 'justify-start'">
                                                <span class="sender-name-compact font-weight-medium">
                                                    {{ getMessageSenderName(message) }}
                                                </span>

                                                <!-- 固定间隙 -->
                                                <span class="message-separator"></span>

                                                <span class="message-time-compact text-caption">
                                                    {{ formatTime(message.createdAt) }}
                                                </span>

                                                <!-- 状态标签 -->
                                                <v-chip v-if="message.isHistory" x-small color="grey" text-color="white"
                                                    class="ml-1">
                                                    历史
                                                </v-chip>
                                                <v-chip v-if="message.isLocal" x-small color="orange" text-color="white"
                                                    class="ml-1">
                                                    发送中
                                                </v-chip>
                                            </div>
                                        </div>

                                        <!-- 消息内容 -->
                                        <div class="message-content-compact px-2 pb-2">
                                            <!-- 文本消息 -->
                                            <div v-if="!message.messageType || message.messageType === 'text'"
                                                class="text-body-2">
                                                {{ message.content }}
                                            </div>

                                            <!-- 图片消息 -->
                                            <div v-else-if="message.messageType === 'image'">
                                                <img :src="message.content" class="message-image-compact"
                                                    @click="showImageModal(message.content)"
                                                    @error="handleImageError" />
                                            </div>

                                            <!-- 文件消息 -->
                                            <div v-else-if="message.messageType === 'file'" class="file-message">
                                                <div class="d-flex align-center pa-2"
                                                    style="background: rgba(255,255,255,0.1); border-radius: 4px;">
                                                    <v-icon
                                                        :color="getFileIconColor(getFileExtension(message.fileName))">
                                                        {{ getFileIcon(getFileExtension(message.fileName)) }}
                                                    </v-icon>
                                                    <div class="ml-2 flex-grow-1">
                                                        <div class="text-body-2 font-weight-medium">{{ message.fileName
                                                            }}</div>
                                                        <div class="text-caption"
                                                            :class="message.senderId === currentUserId ? 'white--text' : 'text--secondary'">
                                                            {{ formatFileSize(message.fileSize) }} • {{
                                                            getFileExtension(message.fileName).toUpperCase() }}
                                                        </div>
                                                    </div>
                                                    <v-btn icon small
                                                        @click="downloadFile(message.content, message.fileName)"
                                                        :color="message.senderId === currentUserId ? 'white' : 'primary'">
                                                        <v-icon small>mdi-download</v-icon>
                                                    </v-btn>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 自己的头像 -->
                                    <v-avatar v-if="message.senderId === currentUserId" size="32" class="ml-2 mt-1">
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
                                <img :src="filePreview.url"
                                    style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid #ccc;" />
                            </div>

                            <!-- 文件预览 -->
                            <div v-else class="file-preview-container d-flex align-center">
                                <v-icon large :color="getFileIconColor(filePreview.extension)">
                                    {{ getFileIcon(filePreview.extension) }}
                                </v-icon>
                                <div class="ml-3">
                                    <div class="text-body-2 font-weight-medium">{{ filePreview.name }}</div>
                                    <div class="text-caption text--secondary">
                                        {{ formatFileSize(filePreview.size) }} • {{ filePreview.extension.toUpperCase()
                                        }}
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
                                    <v-text-field v-model="newMessage" placeholder="输入消息..." outlined dense hide-details
                                        @keyup.enter="sendMessage" :disabled="isBanned || !isConnected"></v-text-field>
                                </v-col>
                                <v-col cols="auto" class="ml-2">
                                    <!-- 通用文件上传按钮 -->
                                    <input ref="fileInput" type="file" style="display: none"
                                        @change="handleFileSelect" />
                                    <v-btn icon @click="$refs.fileInput.click()" :disabled="isBanned || !isConnected"
                                        class="mr-1" title="上传文件（最大10MB）">
                                        <v-icon>mdi-attachment</v-icon>
                                    </v-btn>

                                    <!-- 发送按钮 -->
                                    <v-btn color="primary" @click="sendMessage"
                                        :disabled="(!newMessage.trim() && !filePreview) || isBanned || !isConnected">
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
                    <img :src="modalImageSrc" style="max-width: 100%; max-height: 80vh;" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="imageModal = false">关闭</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 成员管理对话框 -->
        <v-dialog v-model="manageDialog" max-width="900px" scrollable>
            <v-card style="max-height: 80vh;">
                <v-card-title>
                    <v-icon class="mr-2">mdi-account-cog</v-icon>
                    <span class="text-h5">成员管理</span>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="manageDialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                
                <v-card-text style="max-height: calc(80vh - 120px); overflow-y: auto;">
                    <!-- 待审核申请部分 -->
                    <div class="mb-4">
                        <div class="d-flex align-center justify-space-between mb-3">
                            <h3 class="text-h6">
                                <v-icon color="orange" class="mr-2">mdi-clock-outline</v-icon>
                                待审核申请
                            </h3>
                            <v-btn small outlined color="primary" @click="fetchPendingApplications">
                                <v-icon small left>mdi-refresh</v-icon>
                                刷新
                                </v-btn>
                        </div>

                        <div v-if="pendingApplications.length > 0">
                            <v-card v-for="application in pendingApplications" :key="application.id" 
                                    outlined class="mb-3">
                                <v-card-text class="pa-3">
                                    <v-row align="center">
                                        <!-- 用户头像和基本信息 -->
                                        <v-col cols="12" md="6">
                                            <div class="d-flex align-center">
                                                <v-avatar size="40" class="mr-3">
                                                    <v-img :src="application.avatarUrl || defaultAvatar"></v-img>
                                                </v-avatar>
                                                <div>
                                                    <div class="text-body-1 font-weight-medium">
                                                        {{ application.username }}
                                                    </div>
                                                    <div class="text-caption text--secondary">
                                                        ID: {{ application.userId }}
                                                    </div>
                                                    <div class="text-caption text--secondary">
                                                        申请时间: {{ formatApplicationTime(application.createdAt) }}
                                                    </div>
                                                </div>
                                            </div>
                                        </v-col>

                                        <!-- 申请理由 -->
                                        <v-col cols="12" md="6">
                                            <div class="mb-2">
                                                <div class="text-caption text--secondary mb-1">申请理由:</div>
                                                <div class="text-body-2 pa-2 rounded" style="background-color: #f5f5f5; border-left: 3px solid #2196f3;">
                                                    {{ application.reason }}
                                                </div>
                                            </div>
                                        </v-col>

                                        <!-- 操作按钮 -->
                                        <v-col cols="12">
                                            <div class="d-flex justify-end">
                                                <v-btn small color="error" outlined 
                                                       @click="reviewApplication(application.id, 'REJECTED')"
                                                       class="mr-2">
                                                    <v-icon small left>mdi-close</v-icon>
                                    拒绝
                                </v-btn>
                                                <v-btn small color="success" 
                                                       @click="reviewApplication(application.id, 'APPROVED')">
                                                    <v-icon small left>mdi-check</v-icon>
                                                    同意
                                                </v-btn>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-card>

                            <!-- 批量操作区域 -->
                            <v-card outlined class="mt-3">
                                <v-card-text class="pa-3">
                                    <div class="text-caption text--secondary mb-2">批量操作</div>
                                    <div class="d-flex">
                                        <v-btn small color="success" outlined class="mr-2" 
                                               @click="batchApproveApplications" 
                                               :disabled="pendingApplications.length === 0">
                                            <v-icon small left>mdi-check-all</v-icon>
                                            全部同意 ({{ pendingApplications.length }})
                                        </v-btn>
                                        <v-btn small color="error" outlined 
                                               @click="batchRejectApplications"
                                               :disabled="pendingApplications.length === 0">
                                            <v-icon small left>mdi-close-box-multiple</v-icon>
                                            全部拒绝
                                        </v-btn>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </div>

                        <div v-else class="text-center py-6">
                            <v-icon large color="grey lighten-2">mdi-inbox</v-icon>
                            <div class="mt-3 text--secondary">暂无待审核申请</div>
                            <div class="text-caption mt-1">当有新的加入申请时，会显示在这里</div>
                        </div>
                    </div>

                    <v-divider class="my-4"></v-divider>

                    <!-- 成员统计信息 -->
                    <div>
                        <h3 class="text-h6 mb-3">
                            <v-icon color="primary" class="mr-2">mdi-chart-box</v-icon>
                            成员统计
                        </h3>
                        <v-row>
                            <v-col cols="6" md="3">
                                <v-card outlined class="text-center pa-3">
                                    <div class="text-h4 primary--text">{{ totalMembers }}</div>
                                    <div class="text-caption">总成员</div>
                                </v-card>
                            </v-col>
                            <v-col cols="6" md="3">
                                <v-card outlined class="text-center pa-3">
                                    <div class="text-h4 success--text">{{ onlineCount }}</div>
                                    <div class="text-caption">在线成员</div>
                                </v-card>
                            </v-col>
                            <v-col cols="6" md="3">
                                <v-card outlined class="text-center pa-3">
                                    <div class="text-h4 orange--text">{{ pendingApplications.length }}</div>
                                    <div class="text-caption">待审核</div>
                                </v-card>
                            </v-col>
                            <v-col cols="6" md="3">
                                <v-card outlined class="text-center pa-3">
                                    <div class="text-h4 info--text">{{ bannedMembers }}</div>
                                    <div class="text-caption">被禁言</div>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- 打卡任务对话框 -->
        <v-dialog v-model="checkInDialog" max-width="900px" scrollable persistent>
            <v-card style="max-height: 90vh;">
                <v-card-title class="px-4 py-3">
                    <v-icon class="mr-2">mdi-calendar-check</v-icon>
                    <span class="text-h5">打卡任务</span>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="checkInDialog = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>

                <v-tabs v-model="checkInTab" show-arrows>
                    <v-tab>
                        <v-icon left>mdi-view-list</v-icon>
                        任务列表
                    </v-tab>
                    <v-tab>
                        <v-icon left>mdi-account-check</v-icon>
                        我的打卡
                    </v-tab>
                    <v-tab v-if="isAdmin">
                        <v-icon left>mdi-plus-circle</v-icon>
                        创建任务
                    </v-tab>
                    <v-tab v-if="isAdmin">
                        <v-icon left>mdi-cog</v-icon>
                        任务管理
                    </v-tab>
                    <v-tab>
                        <v-icon left>mdi-trophy</v-icon>
                        排行榜
                    </v-tab>
                </v-tabs>

                <v-tabs-items v-model="checkInTab" style="max-height: calc(90vh - 120px); overflow-y: auto;">
                    <!-- 任务列表标签页 -->
                    <v-tab-item>
                        <v-card flat>
                <v-card-text>
                                <div v-if="checkInLoading" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                                    <div class="mt-3">正在加载任务列表...</div>
                                </div>
                                <div v-else-if="checkInTasks.length === 0" class="text-center py-8">
                                    <v-icon large color="grey lighten-2">mdi-calendar-check</v-icon>
                                    <div class="mt-3 text--secondary">暂无打卡任务</div>
                                    <v-btn v-if="isAdmin" color="primary" outlined class="mt-3" @click="checkInTab = 2">
                                        <v-icon left>mdi-plus</v-icon>
                                        创建第一个任务
                                    </v-btn>
                                </div>
                                <div v-else>
                                    <v-row>
                                        <v-col v-for="task in checkInTasks" :key="task.id" cols="12" md="6">
                                            <v-card outlined hover :class="{ 'task-completed': task.userStatus && task.userStatus.hasCheckedInToday }">
                                                <v-card-title class="pb-2">
                                                    <v-icon :color="getTaskStatusColor(task)" class="mr-2">
                                                        {{ getTaskStatusIcon(task) }}
                                                    </v-icon>
                                                    {{ task.taskName }}
                                                    <v-spacer></v-spacer>
                                                    <v-chip small :color="getPeriodTypeColor(task.periodType)" outlined>
                                                        {{ formatPeriodType(task.periodType) }}
                                                    </v-chip>
                                                </v-card-title>
                                                
                                                <v-card-text>
                                                    <div class="text-body-2 mb-2">{{ task.taskDescription || '暂无描述' }}</div>
                                                    
                                                    <!-- 任务基本信息 -->
                                                    <div class="text-caption text--secondary mb-2">
                                                        开始日期：{{ formatDate(task.startDate) }}
                                                    </div>

                                                    <!-- 参与统计信息 -->
                                                    <div class="mb-3">
                                                        <v-row dense>
                                                            <v-col cols="6">
                                                                <v-chip x-small color="blue" outlined>
                                                                    <v-icon x-small left>mdi-account-group</v-icon>
                                                                    {{ formatParticipantCount(task.participantCount) }}
                                                                </v-chip>
                                                            </v-col>
                                                            <v-col cols="6">
                                                                <v-chip x-small color="green" outlined>
                                                                    <v-icon x-small left>mdi-calendar-today</v-icon>
                                                                    {{ formatTodayCheckInCount(task.todayCheckInCount) }}
                                                                </v-chip>
                                                            </v-col>
                                                        </v-row>
                                                    </div>

                                                    <!-- 个人打卡状态 -->
                                                    <div v-if="task.userStatus" class="mb-3">
                                                        <v-divider class="mb-2"></v-divider>
                                                        <div class="text-caption text--secondary mb-1">我的打卡状态：</div>
                                                        <v-row dense>
                                                            <v-col cols="4">
                                                                <div class="text-center">
                                                                    <div class="text-h6 font-weight-bold" :class="task.userStatus.hasCheckedInToday ? 'success--text' : 'grey--text'">
                                                                        {{ task.userStatus.hasCheckedInToday ? '✓' : '○' }}
                                                                    </div>
                                                                    <div class="text-caption">今日</div>
                                                                </div>
                                                            </v-col>
                                                            <v-col cols="4">
                                                                <div class="text-center">
                                                                    <div class="text-h6 font-weight-bold primary--text">
                                                                        {{ task.userStatus.consecutiveDays }}
                                                                    </div>
                                                                    <div class="text-caption">连续天数</div>
                                                                </div>
                                                            </v-col>
                                                            <v-col cols="4">
                                                                <div class="text-center">
                                                                    <div class="text-h6 font-weight-bold info--text">
                                                                        {{ task.userStatus.totalCheckInsThisMonth }}
                                                                    </div>
                                                                    <div class="text-caption">本月</div>
                                                                </div>
                                                            </v-col>
                                                        </v-row>
                                                    </div>

                                                    <!-- 操作按钮区域 -->
                                                    <div class="d-flex align-center justify-space-between">
                                                        <v-chip x-small :color="getTaskStatusColor(task)" text-color="white">
                                                            {{ getTaskStatusText(task) }}
                                                        </v-chip>
                                                        
                                                        <v-btn 
                                                            small 
                                                            :color="canUserCheckIn(task) ? 'primary' : 'grey'" 
                                                            :outlined="!canUserCheckIn(task)"
                                                            :disabled="!canUserCheckIn(task)"
                                                            @click="openCheckInForm(task)"
                                                        >
                                                            <v-icon left small>
                                                                {{ task.userStatus && task.userStatus.hasCheckedInToday ? 'mdi-check' : 'mdi-calendar-check' }}
                                                            </v-icon>
                                                            {{ task.userStatus && task.userStatus.hasCheckedInToday ? '已打卡' : '立即打卡' }}
                                                        </v-btn>
                    </div>
                </v-card-text>
                                            </v-card>
                                        </v-col>
                                    </v-row>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <!-- 我的打卡标签页 -->
                    <v-tab-item>
                        <v-card flat>
                            <v-card-text>
                                <div v-if="myStatusLoading" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                                    <div class="mt-3">正在加载我的打卡状态...</div>
                                </div>
                                <div v-else-if="myCheckInStatus.length === 0" class="text-center py-8">
                                    <v-icon large color="grey lighten-2">mdi-account-check</v-icon>
                                    <div class="mt-3 text--secondary">暂无打卡记录</div>
                                    <div class="text-caption mt-2">当社群有打卡任务时，你的记录会显示在这里</div>
                                </div>
                                <div v-else>
                                    <!-- 打卡概览统计 -->
                                    <v-row class="mb-4">
                                        <v-col cols="12">
                                            <v-card outlined class="pa-4" color="blue lighten-5">
                                                <v-card-title class="pb-2">
                                                    <v-icon color="blue" class="mr-2">mdi-chart-line</v-icon>
                                                    我的打卡概览
                                                </v-card-title>
                                                <v-row>
                                                    <v-col cols="6" md="3">
                                                        <div class="text-center">
                                                            <div class="text-h5 font-weight-bold blue--text">
                                                                {{ getMyTotalTasks() }}
                                                            </div>
                                                            <div class="text-caption">参与任务</div>
                                                        </div>
                                                    </v-col>
                                                    <v-col cols="6" md="3">
                                                        <div class="text-center">
                                                            <div class="text-h5 font-weight-bold success--text">
                                                                {{ getMyTodayCheckIns() }}
                                                            </div>
                                                            <div class="text-caption">今日已打卡</div>
                                                        </div>
                                                    </v-col>
                                                    <v-col cols="6" md="3">
                                                        <div class="text-center">
                                                            <div class="text-h5 font-weight-bold orange--text">
                                                                {{ getMyMaxConsecutive() }}
                                                            </div>
                                                            <div class="text-caption">最长连续</div>
                                                        </div>
                                                    </v-col>
                                                    <v-col cols="6" md="3">
                                                        <div class="text-center">
                                                            <div class="text-h5 font-weight-bold purple--text">
                                                                {{ getMyTotalThisMonth() }}
                                                            </div>
                                                            <div class="text-caption">本月总计</div>
                                                        </div>
                                                    </v-col>
                                                </v-row>
                                            </v-card>
                                        </v-col>
                                    </v-row>

                                    <!-- 任务详细状态列表 -->
                                    <v-row>
                                        <v-col v-for="status in myCheckInStatus" :key="status.taskId" cols="12" md="6">
                                            <v-card outlined hover>
                                                <v-card-title class="pb-2">
                                                    <v-icon :color="status.checkedInToday ? 'success' : 'grey'" class="mr-2">
                                                        {{ status.checkedInToday ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                                                    </v-icon>
                                                    {{ status.taskName }}
                                                    <v-spacer></v-spacer>
                                                    <v-chip 
                                                        small 
                                                        :color="status.checkedInToday ? 'success' : 'grey'" 
                                                        :text-color="status.checkedInToday ? 'success' : 'black'"
                                                        outlined
                                                    >
                                                        {{ status.checkedInToday ? '今日已打卡' : '今日未打卡' }}
                                                    </v-chip>
                                                </v-card-title>

                                                <v-card-text>
                                                    <!-- 打卡统计数据 -->
                                                    <v-row dense class="mb-3">
                                                        <v-col cols="4">
                                                            <div class="text-center pa-2 rounded" style="background: rgba(76, 175, 80, 0.1);">
                                                                <div class="text-h6 font-weight-bold success--text">
                                                                    {{ status.consecutiveDays }}
                                                                </div>
                                                                <div class="text-caption">连续天数</div>
                                                            </div>
                                                        </v-col>
                                                        <v-col cols="4">
                                                            <div class="text-center pa-2 rounded" style="background: rgba(33, 150, 243, 0.1);">
                                                                <div class="text-h6 font-weight-bold blue--text">
                                                                    {{ status.totalCheckInsThisMonth }}
                                                                </div>
                                                                <div class="text-caption">本月打卡</div>
                                                            </div>
                                                        </v-col>
                                                        <v-col cols="4">
                                                            <div class="text-center pa-2 rounded" style="background: rgba(255, 152, 0, 0.1);">
                                                                <div class="text-h6 font-weight-bold orange--text">
                                                                    {{ calculateCompletionRate(status) }}%
                                                                </div>
                                                                <div class="text-caption">完成率</div>
                                                            </div>
                                                        </v-col>
                                                    </v-row>

                                                    <!-- 进度条 -->
                                                    <div class="mb-3">
                                                        <div class="d-flex justify-space-between text-caption mb-1">
                                                            <span>本月完成进度</span>
                                                            <span>{{ status.totalCheckInsThisMonth }} / {{ getCurrentMonthDays() }}</span>
                                                        </div>
                                                        <v-progress-linear
                                                            :value="calculateCompletionRate(status)"
                                                            :color="getProgressColor(calculateCompletionRate(status))"
                                                            height="8"
                                                            rounded
                                                        ></v-progress-linear>
                                                    </div>

                                                    <!-- 操作按钮 -->
                                                    <div class="d-flex justify-space-between align-center">
                                                        <v-btn 
                                                            small 
                                                            text 
                                                            color="primary"
                                                            @click="viewTaskDetails(status)"
                                                        >
                                                            <v-icon left small>mdi-chart-line</v-icon>
                                                            查看详情
                                                        </v-btn>
                                                        
                                                        <v-btn 
                                                            small 
                                                            :color="status.checkedInToday ? 'grey' : 'success'"
                                                            :outlined="status.checkedInToday"
                                                            :disabled="status.checkedInToday"
                                                            @click="quickCheckIn(status)"
                                                        >
                                                            <v-icon left small>
                                                                {{ status.checkedInToday ? 'mdi-check' : 'mdi-plus' }}
                                                            </v-icon>
                                                            {{ status.checkedInToday ? '已完成' : '立即打卡' }}
                                                        </v-btn>
                                                    </div>
                                                </v-card-text>
                                            </v-card>
                                        </v-col>
                                    </v-row>

                                    <!-- 刷新按钮 -->
                                    <div class="text-center mt-4">
                                        <v-btn outlined color="primary" @click="fetchMyCheckInStatus">
                                            <v-icon left>mdi-refresh</v-icon>
                                            刷新状态
                                        </v-btn>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <!-- 创建任务标签页 -->
                    <v-tab-item v-if="isAdmin">
                        <v-card flat>
                            <v-card-text>
                                <v-form ref="taskForm" v-model="taskFormValid" @submit.prevent="submitTask">
                                    <v-container>
                                        <v-row>
                                            <v-col cols="12">
                                                <v-text-field
                                                    v-model="taskForm.taskName"
                                                    label="任务名称 *"
                                                    placeholder="例如：每日阅读"
                                                    outlined
                                                    dense
                                                    :rules="taskNameRules"
                                                    counter="50"
                                                    maxlength="50"
                                                    required
                                                >
                                                    <template v-slot:prepend-inner>
                                                        <v-icon color="primary">mdi-format-title</v-icon>
                                                    </template>
                                                </v-text-field>
                                            </v-col>
                                            
                                            <v-col cols="12">
                                                <v-textarea
                                                    v-model="taskForm.taskDescription"
                                                    label="任务描述"
                                                    placeholder="详细描述这个打卡任务的要求和目标..."
                                                    outlined
                                                    dense
                                                    rows="3"
                                                    counter="200"
                                                    maxlength="200"
                                                    :rules="taskDescriptionRules"
                                                >
                                                    <template v-slot:prepend-inner>
                                                        <v-icon color="primary">mdi-text</v-icon>
                                                    </template>
                                                </v-textarea>
                                            </v-col>

                                            <v-col cols="12" md="6">
                                                <v-select
                                                    v-model="taskForm.periodType"
                                                    :items="periodTypes"
                                                    label="打卡周期 *"
                                                    outlined
                                                    dense
                                                    required
                                                    :rules="periodTypeRules"
                                                >
                                                    <template v-slot:prepend-inner>
                                                        <v-icon color="primary">mdi-calendar-repeat</v-icon>
                                                    </template>
                                                </v-select>
                                            </v-col>

                                            <v-col cols="12" md="6">
                                                <v-text-field
                                                    v-model="taskForm.startDate"
                                                    label="开始日期"
                                                    type="date"
                                                    outlined
                                                    dense
                                                    :min="getTodayDate()"
                                                    :rules="startDateRules"
                                                    hint="留空则使用今天作为开始日期"
                                                    persistent-hint
                                                >
                                                    <template v-slot:prepend-inner>
                                                        <v-icon color="primary">mdi-calendar-start</v-icon>
                                                    </template>
                                                </v-text-field>
                                            </v-col>

                                            <v-col cols="12">
                                                <v-alert type="info" outlined dense>
                                                    <div class="d-flex align-center">
                                                        <v-icon class="mr-2">mdi-information</v-icon>
                                                        <div>
                                                            <strong>创建提示：</strong>
                                                            <ul class="mt-1 mb-0">
                                                                <li>任务创建后将立即生效，社群成员可以开始打卡</li>
                                                                <li>每日打卡：成员每天可以打卡一次</li>
                                                                <li>每周打卡：成员每周可以打卡一次</li>
                                                                <li>开始日期留空将使用今天作为任务开始时间</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </v-alert>
                                            </v-col>

                                            <v-col cols="12">
                                                <div class="d-flex justify-end">
                                                    <v-btn text @click="resetTaskForm" class="mr-3">
                                                        <v-icon left>mdi-refresh</v-icon>
                                                        重置
                                                    </v-btn>
                                                    <v-btn 
                                                        color="primary" 
                                                        :loading="taskSubmitting"
                                                        :disabled="!taskFormValid"
                                                        @click="submitTask"
                                                    >
                                                        <v-icon left>mdi-plus</v-icon>
                                                        创建任务
                                                    </v-btn>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </v-container>
                                </v-form>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <!-- 任务管理标签页 -->
                    <v-tab-item v-if="isAdmin">
                        <v-card flat>
                            <v-card-text>
                                <div v-if="checkInLoading" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                                    <div class="mt-3">正在加载任务列表...</div>
                                </div>
                                <div v-else-if="checkInTasks.length === 0" class="text-center py-8">
                                    <v-icon large color="grey lighten-2">mdi-cog</v-icon>
                                    <div class="mt-3 text--secondary">暂无任务需要管理</div>
                                    <v-btn color="primary" outlined class="mt-3" @click="checkInTab = 2">
                                        <v-icon left>mdi-plus</v-icon>
                                        创建第一个任务
                                    </v-btn>
                                </div>
                                <div v-else>
                                    <!-- 任务管理操作栏 -->
                                    <div class="d-flex justify-space-between align-center mb-4">
                                        <div>
                                            <h3 class="text-h6">任务管理</h3>
                                            <div class="text-caption text--secondary">
                                                共 {{ checkInTasks.length }} 个任务
                                            </div>
                                        </div>
                                        <v-btn color="primary" @click="checkInTab = 2">
                                            <v-icon left>mdi-plus</v-icon>
                                            新建任务
                                        </v-btn>
                                    </div>

                                    <!-- 任务管理表格 -->
                                    <v-data-table
                                        :headers="taskManageHeaders"
                                        :items="checkInTasks"
                                        :loading="taskOperationLoading"
                                        class="elevation-1"
                                        :items-per-page="10"
                                        :footer-props="{
                                            'items-per-page-text': '每页显示',
                                            'items-per-page-options': [5, 10, 20, -1]
                                        }"
                                    >
                                        <!-- 任务名称列 -->
                                        <template #[`item.taskName`]="{ item }">
                                            <div>
                                                <div class="font-weight-medium">{{ item.taskName }}</div>
                                                <div class="text-caption text--secondary" v-if="item.taskDescription">
                                                    {{ item.taskDescription.length > 30 ? item.taskDescription.substring(0, 30) + '...' : item.taskDescription }}
                                                </div>
                                            </div>
                                        </template>

                                        <!-- 周期类型列 -->
                                        <template #[`item.periodType`]="{ item }">
                                            <v-chip small :color="getPeriodTypeColor(item.periodType)" outlined>
                                                {{ formatPeriodType(item.periodType) }}
                                            </v-chip>
                                        </template>

                                        <!-- 开始日期列 -->
                                        <template #[`item.startDate`]="{ item }">
                                            {{ formatDate(item.startDate) }}
                                        </template>

                                        <!-- 状态列 -->
                                        <template #[`item.status`]="{ item }">
                                            <v-chip 
                                                small 
                                                :color="getTaskStatusColor(item)" 
                                                :outlined="item.status !== 1"
                                                :text-color="item.status === 1 ? 'white' : undefined"
                                            >
                                                <v-icon left x-small>
                                                    {{ getTaskStatusIcon(item) }}
                                                </v-icon>
                                                {{ getTaskStatusText(item) }}
                                            </v-chip>
                                        </template>

                                        <!-- 统计信息列 -->
                                        <template #[`item.stats`]="{ item }">
                                            <div class="text-caption">
                                                <div>{{ formatParticipantCount(item.participantCount) }}</div>
                                                <div>{{ formatTodayCheckInCount(item.todayCheckInCount) }}</div>
                                            </div>
                                        </template>

                                        <!-- 操作列 -->
                                        <template #[`item.actions`]="{ item }">
                                            <div class="d-flex align-center">
                                                <!-- 启用/停用按钮 -->
                                                <v-tooltip bottom>
                                                    <template v-slot:activator="{ on, attrs }">
                                                        <v-btn
                                                            icon
                                                            small
                                                            :color="item.status === 1 ? 'warning' : 'success'"
                                                            @click="toggleTaskStatus(item)"
                                                            :loading="item.updating"
                                                            v-bind="attrs"
                                                            v-on="on"
                                                        >
                                                            <v-icon small>
                                                                {{ item.status === 1 ? 'mdi-pause' : 'mdi-play' }}
                                                            </v-icon>
                                                        </v-btn>
                                                    </template>
                                                    <span>{{ item.status === 1 ? '停用任务' : '启用任务' }}</span>
                                                </v-tooltip>

                                                <!-- 编辑按钮 -->
                                                <v-tooltip bottom>
                                                    <template v-slot:activator="{ on, attrs }">
                                                        <v-btn
                                                            icon
                                                            small
                                                            color="primary"
                                                            @click="editTask(item)"
                                                            v-bind="attrs"
                                                            v-on="on"
                                                        >
                                                            <v-icon small>mdi-pencil</v-icon>
                                                        </v-btn>
                                                    </template>
                                                    <span>编辑任务</span>
                                                </v-tooltip>

                                                <!-- 删除按钮 -->
                                                <v-tooltip bottom>
                                                    <template v-slot:activator="{ on, attrs }">
                                                        <v-btn
                                                            icon
                                                            small
                                                            color="error"
                                                            @click="deleteTask(item)"
                                                            :loading="item.deleting"
                                                            v-bind="attrs"
                                                            v-on="on"
                                                        >
                                                            <v-icon small>mdi-delete</v-icon>
                                                        </v-btn>
                                                    </template>
                                                    <span>删除任务</span>
                                                </v-tooltip>

                                                <!-- 查看详情按钮 -->
                                                <v-tooltip bottom>
                                                    <template v-slot:activator="{ on, attrs }">
                                                        <v-btn
                                                            icon
                                                            small
                                                            color="info"
                                                            @click="viewTaskStats(item)"
                                                            v-bind="attrs"
                                                            v-on="on"
                                                        >
                                                            <v-icon small>mdi-chart-line</v-icon>
                                                        </v-btn>
                                                    </template>
                                                    <span>查看统计</span>
                                                </v-tooltip>
                                            </div>
                                        </template>
                                    </v-data-table>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <!-- 排行榜标签页 -->
                    <v-tab-item>
                        <v-card flat>
                            <v-card-text>
                                <div v-if="leaderboardLoading" class="text-center py-8">
                                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                                    <div class="mt-3">正在加载排行榜...</div>
                                </div>
                                <div v-else>
                                    <!-- 排行榜控制区域 -->
                                    <div class="d-flex justify-space-between align-center mb-4">
                                        <div>
                                            <h3 class="text-h6">打卡排行榜</h3>
                                            <div class="text-caption text--secondary">
                                                展示社群成员的打卡表现
                                            </div>
                                        </div>
                                        <v-btn outlined color="primary" @click="refreshLeaderboard">
                                            <v-icon left>mdi-refresh</v-icon>
                                            刷新
                                        </v-btn>
                                    </div>

                                    <!-- 任务选择器 -->
                                    <v-row class="mb-4">
                                        <v-col cols="12" md="6">
                                            <v-select
                                                v-model="selectedLeaderboardTaskId"
                                                :items="leaderboardTaskOptions"
                                                item-text="taskName"
                                                item-value="id"
                                                label="选择查看的任务"
                                                outlined
                                                dense
                                                @change="fetchLeaderboard"
                                            >
                                                <template v-slot:prepend-inner>
                                                    <v-icon color="primary">mdi-trophy</v-icon>
                                                </template>
                                            </v-select>
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-select
                                                v-model="leaderboardType"
                                                :items="leaderboardTypes"
                                                label="排行榜类型"
                                                outlined
                                                dense
                                                @change="sortLeaderboard"
                                            >
                                                <template v-slot:prepend-inner>
                                                    <v-icon color="primary">mdi-sort</v-icon>
                                                </template>
                                            </v-select>
                                        </v-col>
                                    </v-row>

                                    <!-- 排行榜内容 -->
                                    <div v-if="!selectedLeaderboardTaskId" class="text-center py-8">
                                        <v-icon large color="grey lighten-2">mdi-trophy</v-icon>
                                        <div class="mt-3 text--secondary">请选择一个任务查看排行榜</div>
                                    </div>
                                    <div v-else-if="leaderboard.length === 0" class="text-center py-8">
                                        <v-icon large color="grey lighten-2">mdi-account-group</v-icon>
                                        <div class="mt-3 text--secondary">该任务暂无排行榜数据</div>
                                    </div>
                                    <div v-else>
                                        <!-- 前三名特殊展示 -->
                                        <div class="mb-6">
                                            <h4 class="text-h6 mb-3">🏆 冠军榜</h4>
                                            <v-row>
                                                <v-col 
                                                    v-for="user in getTopThree()" 
                                                    :key="user.userId" 
                                                    cols="12" 
                                                    md="4"
                                                >
                                                    <v-card 
                                                        :class="[
                                                            'text-center pa-4 position-relative',
                                                            getRankCardClass(user.rank)
                                                        ]"
                                                        :elevation="user.rank === 1 ? 8 : 4"
                                                    >
                                                        <!-- 排名徽章 -->
                                                        <div class="rank-badge" :class="getRankBadgeClass(user.rank)">
                                                            {{ getRankIcon(user.rank) }}
                                                        </div>
                                                        
                                                        <!-- 用户头像 -->
                                                        <v-avatar 
                                                            :size="user.rank === 1 ? 80 : 64" 
                                                            class="mb-3"
                                                            :class="{ 'golden-border': user.rank === 1 }"
                                                        >
                                                            <v-img :src="user.avatar || user.avatarUrl || defaultAvatar"></v-img>
                                                        </v-avatar>

                                                        <!-- 用户信息 -->
                                                        <div class="text-h6 font-weight-bold">{{ user.username }}</div>
                                                        <div v-if="user.nickname && user.nickname !== user.username" 
                                                             class="text-caption text--secondary mb-2">
                                                            {{ user.nickname }}
                                                        </div>

                                                        <!-- 统计数据 -->
                                                        <div class="d-flex justify-center align-center mb-2">
                                                            <div class="text-center mx-2">
                                                                <div class="text-h6 font-weight-bold primary--text">
                                                                    {{ user.consecutiveDays }}
                                                                </div>
                                                                <div class="text-caption">连续天数</div>
                                                            </div>
                                                            <v-divider vertical class="mx-2"></v-divider>
                                                            <div class="text-center mx-2">
                                                                <div class="text-h6 font-weight-bold success--text">
                                                                    {{ user.totalCheckInsThisMonth }}
                                                                </div>
                                                                <div class="text-caption">本月打卡</div>
                                                            </div>
                                                        </div>

                                                        <!-- 排名显示 -->
                                                        <v-chip 
                                                            small 
                                                            :color="getRankColor(user.rank)" 
                                                            text-color="white"
                                                        >
                                                            第 {{ user.rank }} 名
                                                        </v-chip>
                                                    </v-card>
                                                </v-col>
                                            </v-row>
                                        </div>

                                        <!-- 完整排行榜列表 -->
                                        <div>
                                            <h4 class="text-h6 mb-3">📋 完整排行榜</h4>
                                            <v-list class="elevation-1">
                                                <v-list-item 
                                                    v-for="user in sortedLeaderboard" 
                                                    :key="user.userId"
                                                    :class="{ 'highlight-user': user.userId === currentUserId }"
                                                >
                                                    <!-- 排名 -->
                                                    <v-list-item-avatar>
                                                        <div 
                                                            class="rank-number d-flex align-center justify-center"
                                                            :class="getRankNumberClass(user.rank)"
                                                        >
                                                            <span class="font-weight-bold">{{ user.rank }}</span>
                                                        </div>
                                                    </v-list-item-avatar>

                                                    <!-- 用户头像 -->
                                                    <v-list-item-avatar class="ml-2 mr-3">
                                                        <v-img :src="user.avatar || user.avatarUrl || defaultAvatar"></v-img>
                                                    </v-list-item-avatar>

                                                    <!-- 用户信息 -->
                                                    <v-list-item-content>
                                                        <v-list-item-title class="d-flex align-center">
                                                            <span class="font-weight-medium">{{ user.username }}</span>
                                                            <v-chip 
                                                                v-if="user.userId === currentUserId" 
                                                                x-small 
                                                                color="primary" 
                                                                text-color="white" 
                                                                class="ml-2"
                                                            >
                                                                我
                                                            </v-chip>
                                                        </v-list-item-title>
                                                        <v-list-item-subtitle v-if="user.nickname && user.nickname !== user.username">
                                                            {{ user.nickname }}
                                                        </v-list-item-subtitle>
                                                    </v-list-item-content>

                                                    <!-- 统计数据 -->
                                                    <v-list-item-action class="d-flex flex-row align-center">
                                                        <div class="text-center mx-3">
                                                            <div class="text-body-2 font-weight-bold primary--text">
                                                                {{ user.consecutiveDays }}
                                                            </div>
                                                            <div class="text-caption text--secondary">连续</div>
                                                        </div>
                                                        <div class="text-center mx-3">
                                                            <div class="text-body-2 font-weight-bold success--text">
                                                                {{ user.totalCheckInsThisMonth }}
                                                            </div>
                                                            <div class="text-caption text--secondary">本月</div>
                                                        </div>
                                                        <div class="text-center mx-3">
                                                            <v-chip 
                                                                small 
                                                                :color="getRankColor(user.rank)" 
                                                                :outlined="user.rank > 3"
                                                                :text-color="user.rank <= 3 ? 'white' : undefined"
                                                            >
                                                                {{ user.rank }}
                                                            </v-chip>
                                                        </div>
                                                    </v-list-item-action>
                                                </v-list-item>
                                            </v-list>
                                        </div>

                                        <!-- 我的排名信息 -->
                                        <div v-if="getMyRankInfo()" class="mt-4">
                                            <v-alert type="info" outlined dense>
                                                <div class="d-flex align-center">
                                                    <v-icon class="mr-2">mdi-account-star</v-icon>
                                                    <div>
                                                        <strong>我的排名：</strong>
                                                        第 {{ getMyRankInfo().rank }} 名 | 
                                                        连续打卡 {{ getMyRankInfo().consecutiveDays }} 天 | 
                                                        本月打卡 {{ getMyRankInfo().totalCheckInsThisMonth }} 次
                                                    </div>
                                                </div>
                                            </v-alert>
                                        </div>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>
                </v-tabs-items>
            </v-card>
        </v-dialog>

        <!-- 打卡表单对话框 -->
        <v-dialog v-model="checkInFormDialog" max-width="500px" persistent>
            <v-card>
                <v-card-title>
                    <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
                    今日打卡
                </v-card-title>
                <v-card-text v-if="currentCheckInTask">
                    <div class="mb-4">
                        <v-alert type="info" outlined dense>
                            <strong>{{ currentCheckInTask.taskName }}</strong>
                            <div class="text-caption mt-1">{{ currentCheckInTask.taskDescription }}</div>
                        </v-alert>
                    </div>
                    
                    <v-textarea
                        v-model="checkInNotes"
                        label="打卡笔记（可选）"
                        placeholder="记录今天的收获、感想或遇到的问题..."
                        outlined
                        rows="4"
                        counter="500"
                        maxlength="500"
                        hint="分享你的打卡心得，让其他成员看到你的坚持！"
                        persistent-hint
                    ></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="closeCheckInForm">取消</v-btn>
                    <v-btn 
                        color="success" 
                        :loading="checkInSubmitting"
                        @click="submitCheckIn"
                    >
                        <v-icon left>mdi-check</v-icon>
                        完成打卡
                    </v-btn>
                </v-card-actions>
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
                myCheckInStatus: [], // 我的打卡状态列表
                myStatusLoading: false, // 我的状态加载中

                // 排行榜相关
                selectedLeaderboardTaskId: null, // 排行榜选中的任务ID
                leaderboardType: 'rank', // 排行榜类型
                leaderboard: [], // 排行榜数据
                leaderboardLoading: false, // 排行榜加载状态
                leaderboardTypes: [
                    { text: '综合排名', value: 'rank' },
                    { text: '连续天数', value: 'consecutive' },
                    { text: '本月打卡', value: 'monthly' }
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
                    { text: '任务名称', value: 'taskName', sortable: true },
                    { text: '周期', value: 'periodType', sortable: true },
                    { text: '开始日期', value: 'startDate', sortable: true },
                    { text: '状态', value: 'status', sortable: true },
                    { text: '统计', value: 'stats', sortable: false },
                    { text: '操作', value: 'actions', sortable: false, align: 'center', width: '200px' }
                ],

                // 表单验证规则
                taskNameRules: [
                    v => !!v || '任务名称不能为空',
                    v => (v && v.length >= 2) || '任务名称至少需要2个字符',
                    v => (v && v.length <= 50) || '任务名称不能超过50个字符'
                ],
                taskDescriptionRules: [
                    v => !v || v.length <= 200 || '任务描述不能超过200个字符'
                ],
                periodTypeRules: [
                    v => !!v || '请选择打卡周期'
                ],
                startDateRules: [
                    v => !v || new Date(v) >= new Date().setHours(0,0,0,0) || '开始日期不能早于今天'
                ],

                // 任务管理相关
                taskOperationLoading: false, // 任务操作加载状态
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
            },
            // 排行榜相关
            leaderboardTaskOptions() {
                return this.checkInTasks.map(task => ({
                    id: task.id,
                    taskName: task.taskName
                }));
            },
            sortedLeaderboard() {
                if (!this.leaderboard || this.leaderboard.length === 0) return [];
                
                let sorted = [...this.leaderboard];
                
                switch (this.leaderboardType) {
                    case 'consecutive':
                        sorted.sort((a, b) => b.consecutiveDays - a.consecutiveDays);
                        break;
                    case 'monthly':
                        sorted.sort((a, b) => b.totalCheckInsThisMonth - a.totalCheckInsThisMonth);
                        break;
                    case 'rank':
                    default:
                        sorted.sort((a, b) => a.rank - b.rank);
                        break;
                }
                
                return sorted;
            },

            // 计算总成员数
            totalMembers() {
                return this.members.length;
            },

            // 计算被禁言成员数
            bannedMembers() {
                return this.members.filter(member => member.isBanned).length;
            },
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

                // 加载打卡任务和我的状态
                await Promise.all([
                    this.fetchCheckInTasks(),
                    this.fetchMyCheckInStatus()
                ]);
                console.log('✅ 打卡任务和状态加载完成');

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
                
               const rawToken = this.$axios.defaults.headers.common['Authorization'] || localStorage.getItem('token');
                const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
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

            // 获取成员列表 - 根据role字段判断禁言状态
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

                                    // 判断禁言状态：role为"ban"表示被禁言
                                    const isBanned = member.role.toLowerCase() === 'ban';
                                    
                                    // 获取实际角色：如果被禁言，实际角色应该是member
                                    const actualRole = isBanned ? 'MEMBER' : member.role.toUpperCase();

                                    return {
                                        id: member.id,
                                        userId: member.userId,
                                        communityId: member.communityId,
                                        role: actualRole, // 显示的角色（禁言用户显示为MEMBER）
                                        originalRole: member.role, // 保存原始role用于判断禁言状态
                                        joinedAt: member.joinedAt,
                                        // 用户详细信息
                                        username: userInfo.username || `用户${member.userId}`,
                                        avatarUrl: userInfo.avatarUrl || '',
                                        email: userInfo.email || '',
                                        // 在线状态
                                        isOnline: false,
                                        // 根据role字段判断禁言状态
                                        isBanned: isBanned
                                    };
                                } catch (userError) {
                                    console.error(`获取用户${member.userId}信息失败:`, userError);
                                    
                                    const isBanned = member.role.toLowerCase() === 'ban';
                                    const actualRole = isBanned ? 'MEMBER' : member.role.toUpperCase();
                                    
                                    return {
                                        id: member.id,
                                        userId: member.userId,
                                        communityId: member.communityId,
                                        role: actualRole,
                                        originalRole: member.role,
                                        joinedAt: member.joinedAt,
                                        username: `用户${member.userId}`,
                                        avatarUrl: '',
                                        email: '',
                                        isOnline: false,
                                        isBanned: isBanned
                                    };
                                }
                            })
                        );

                        this.members = processedMembers;
                        console.log('处理后的成员列表:', this.members);
                        
                        // 调试：输出每个成员的禁言状态
                        this.members.forEach(member => {
                            console.log(`👤 成员 ${member.username}: role=${member.originalRole}, isBanned=${member.isBanned}`);
                        });
                    } else {
                        console.warn('成员列表数据格式异常:', response.data);
                        this.members = [];
                    }
                } catch (error) {
                    console.error('获取成员列表失败:', error);
                    this.members = [];
                }
            },

            // 获取当前用户信息（根据role判断禁言状态）
            async getCurrentUser() {
                try {
                    console.log('🔍 正在获取当前用户信息...');
                    const response = await this.$axios.get('/api/users/me');
                    console.log('📱 用户API响应:', response.data);

                    if (response.data && response.data.code === 1 && response.data.data && response.data.data.userId) {
                        const userData = response.data.data;
                        this.currentUserId = parseInt(userData.userId);
                        console.log('✅ 当前用户ID:', this.currentUserId);

                        if (Array.isArray(this.members) && this.members.length > 0) {
                            const member = this.members.find(m => m.userId === this.currentUserId);
                            if (member) {
                                // 根据originalRole判断禁言状态
                                this.isBanned = member.originalRole && member.originalRole.toLowerCase() === 'ban';
                                
                                // 设置显示角色
                                if (member.originalRole && member.originalRole.toLowerCase() === 'ban') {
                                    this.userRole = 'MEMBER'; // 被禁言的用户显示为普通成员
                                } else {
                                this.userRole = member.role || 'MEMBER';
                                }
                                
                                console.log('👤 用户角色:', this.userRole, '原始role:', member.originalRole, '是否被禁:', this.isBanned);
                            } else {
                                console.warn('⚠️ 在成员列表中未找到当前用户');
                                this.userRole = 'VISITOR';
                                this.isBanned = false;
                            }
                        } else {
                            this.userRole = 'VISITOR';
                            this.isBanned = false;
                        }
                    }
                } catch (error) {
                    console.error('❌ 获取用户信息失败:', error);
                    this.currentUserId = null;
                    this.userRole = 'MEMBER';
                    this.isBanned = false;
                }
            },

            // 退出社群（完善响应处理）
            async leaveCommunity() {
                if (!confirm('确定要退出这个社群吗？')) return;

                try {
                    console.log('🚪 正在退出社群...', this.communityId);
                    
                    const response = await this.$axios.post('/api/community/applications/leave', null, {
                        params: { communityId: this.communityId }
                    });
                    
                    console.log('📝 退出社群响应:', response.data);
                    
                    // 检查响应格式（后端返回 code: 200 表示成功）
                    if (response.data && response.data.code === 200) {
                        console.log('✅ 退出社群成功');
                        alert('已成功退出社群');
                        
                        // 断开WebSocket连接
                        this.disconnectWebSocket();
                        
                        // 跳转到首页
                    this.$router.push('/FrontPage');
                    } else {
                        console.error('❌ 退出社群失败:', response.data);
                        const errorMsg = response.data?.message || response.data?.msg || '退出失败';
                        alert('退出失败：' + errorMsg);
                    }
                } catch (error) {
                    console.error('❌ 退出社群异常:', error);
                    
                    // 详细错误处理
                    if (error.response) {
                        const errorMsg = error.response.data?.message || 
                                       error.response.data?.msg || 
                                       `服务器错误 (${error.response.status})`;
                        alert('退出失败：' + errorMsg);
                        console.error('响应错误:', error.response.data);
                    } else if (error.request) {
                        alert('退出失败：网络连接错误，请检查网络后重试');
                        console.error('请求错误:', error.request);
                    } else {
                        alert('退出失败：' + error.message);
                        console.error('其他错误:', error.message);
                    }
                }
            },

            // 获取待审核申请（完善版）
            async fetchPendingApplications() {
                try {
                    console.log('🔍 正在获取待审核申请列表...');
                    const response = await this.$axios.get('/api/community/applications/pending', {
                        params: { communityId: this.communityId }
                    });

                    console.log('📝 待审核申请原始数据:', response.data);

                    if (response.data.code === 1 && Array.isArray(response.data.data)) {
                        // 处理申请数据，获取申请用户的详细信息
                        const applications = response.data.data;
                        
                        const processedApplications = await Promise.all(
                            applications.map(async (application) => {
                                try {
                                    // 根据userId获取用户详细信息
                                    const userResponse = await this.$axios.get(`/api/users/${application.userId}`);
                                    const userInfo = userResponse.data.code === 1 ? userResponse.data.data : {};

                                    return {
                                        id: application.id,
                                        communityId: application.communityId,
                                        userId: application.userId,
                                        status: application.status,
                                        reason: application.reason || '无申请理由',
                                        createdAt: application.createdAt,
                                        updatedAt: application.updatedAt,
                                        // 用户详细信息
                                        username: userInfo.username || `用户${application.userId}`,
                                        avatarUrl: userInfo.avatarUrl || '',
                                        email: userInfo.email || ''
                                    };
                                } catch (userError) {
                                    console.error(`获取申请用户${application.userId}信息失败:`, userError);
                                    // 如果获取用户信息失败，使用默认值
                                    return {
                                        ...application,
                                        username: `用户${application.userId}`,
                                        avatarUrl: '',
                                        email: '',
                                        reason: application.reason || '无申请理由'
                                    };
                                }
                            })
                        );

                        this.pendingApplications = processedApplications;
                        console.log('✅ 待审核申请处理完成:', this.pendingApplications);
                    } else {
                        console.warn('⚠️ 待审核申请数据格式异常:', response.data);
                        this.pendingApplications = [];
                    }
                } catch (error) {
                    console.error('❌ 获取待审核申请失败:', error);
                    this.pendingApplications = [];
                }
            },

            // 审核申请（修复响应处理）
            async reviewApplication(applicationId, status) {
                try {
                    console.log('🔍 正在审核申请:', applicationId, '状态:', status);
                    
                    const response = await this.$axios.post('/api/community/applications/review', null, {
                        params: { applicationId, status }
                    });
                    
                    console.log('📝 审核申请响应:', response.data);
                    
                    // 检查响应格式
                    if (response.data && response.data.code === 1) {
                        console.log('✅ 审核申请成功');
                    alert(status === 'APPROVED' ? '已同意申请' : '已拒绝申请');
                        
                        // 刷新相关数据
                            await Promise.all([
                            this.fetchPendingApplications(),
                            this.fetchMembers()
                        ]);
                    } else {
                        console.error('❌ 审核申请失败:', response.data);
                        const errorMsg = response.data?.msg || response.data?.message || '审核失败';
                        alert('操作失败：' + errorMsg);
                    }
                } catch (error) {
                    console.error('❌ 审核申请异常:', error);
                    
                    // 详细错误处理
                    if (error.response) {
                        const errorMsg = error.response.data?.msg || 
                                       error.response.data?.message || 
                                       `服务器错误 (${error.response.status})`;
                        alert('操作失败：' + errorMsg);
                        console.error('响应错误:', error.response.data);
                    } else if (error.request) {
                        alert('操作失败：网络连接错误，请检查网络后重试');
                        console.error('请求错误:', error.request);
                    } else {
                        alert('操作失败：' + error.message);
                        console.error('其他错误:', error.message);
                    }
                }
            },

            // 获取打卡任务列表（修复字段映射）
            async fetchCheckInTasks() {
                this.checkInLoading = true;
                try {
                    console.log('🔍 正在获取打卡任务列表...');
                    const response = await this.$axios.get(`/api/community/${this.communityId}/check-in/tasks`);

                    if (response.data.code === 1) {
                        this.checkInTasks = response.data.data || [];
                        console.log('✅ 打卡任务列表获取成功:', this.checkInTasks.length, '个任务');
                        console.log('📝 任务详情:', this.checkInTasks);

                        // 处理任务状态映射（统一字段名）
                        this.checkInTasks = this.checkInTasks.map(task => ({
                            ...task,
                            // 保持原始的数字状态，不转换
                            status: task.status, // 0 或 1
                            // 添加用户相关状态 - 统一使用原始字段名
                            userStatus: {
                                hasCheckedInToday: task.userCheckedInToday || false,
                                consecutiveDays: task.userConsecutiveDays || 0,
                                monthlyCheckIns: task.userTotalCheckInsThisMonth || 0  // 映射为 monthlyCheckIns
                            }
                        }));

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

            // 提升成员为管理员（修改接口地址）
            async promoteMember(member) {
                if (!confirm(`确定要将 ${member.username} 提升为管理员吗？`)) return;

                try {
                    await this.$axios.post('/api/community/applications/setAdmin', null, {
                        params: {
                        communityId: this.communityId,
                        userId: member.userId
                        }
                    });

                    // 更新本地数据
                    const memberIndex = this.members.findIndex(m => m.id === member.id);
                    if (memberIndex !== -1) {
                        this.members[memberIndex].role = 'ADMIN';
                    }

                    alert(`${member.username} 已提升为管理员`);
                } catch (error) {
                    console.error('提升成员失败:', error);
                    alert('操作失败，请重试');
                }
            },

            // 降级管理员为普通成员（修改接口地址）
            async demoteMember(member) {
                if (!confirm(`确定要将管理员 ${member.username} 降为普通成员吗？`)) return;

                try {
                    await this.$axios.post('/api/community/applications/cancelAdmins', null, {
                        params: {
                        communityId: this.communityId,
                        userId: member.userId
                        }
                    });

                    // 更新本地数据
                    const memberIndex = this.members.findIndex(m => m.id === member.id);
                    if (memberIndex !== -1) {
                        this.members[memberIndex].role = 'MEMBER';
                    }

                    alert(`${member.username} 已降为普通成员`);
                } catch (error) {
                    console.error('降级成员失败:', error);
                    alert('操作失败，请重试');
                }
            },

            // 禁言成员（使用正确的接口地址）
            async banMember(member) {
                if (!confirm(`确定要禁言 ${member.username} 吗？`)) return;

                try {
                    // 使用正确的接口地址
                    await this.$axios.post('/api/community/applications/setBans', null, {
                        params: {
                        communityId: this.communityId,
                            userId: member.userId
                        }
                    });

                    // 更新本地数据 - 将role设置为ban，标记为已禁言
                    const memberIndex = this.members.findIndex(m => m.id === member.id);
                    if (memberIndex !== -1) {
                        this.$set(this.members[memberIndex], 'originalRole', 'ban');
                        this.$set(this.members[memberIndex], 'isBanned', true);
                        // 显示角色保持为MEMBER，但实际已被禁言
                        this.$set(this.members[memberIndex], 'role', 'MEMBER');
                    }

                    // 如果是当前用户被禁言，更新全局状态
                    if (member.userId === this.currentUserId) {
                        this.isBanned = true;
                    }

                    alert(`${member.username} 已被禁言`);
                    console.log('✅ 禁言操作完成 - role已更新为ban');
                } catch (error) {
                    console.error('禁言成员失败:', error);
                    alert('操作失败，请重试');
                }
            },

            // 解禁成员（使用正确的接口地址）
            async unbanMember(member) {
                if (!confirm(`确定要解禁 ${member.username} 吗？`)) return;

                try {
                    // 使用正确的接口地址
                    await this.$axios.post('/api/community/applications/cancelBans', null, {
                        params: {
                            communityId: this.communityId,
                            userId: member.userId
                        }
                    });

                    // 更新本地数据 - 将role恢复为member，标记为已解禁
                    const memberIndex = this.members.findIndex(m => m.id === member.id);
                    if (memberIndex !== -1) {
                        this.$set(this.members[memberIndex], 'originalRole', 'member');
                        this.$set(this.members[memberIndex], 'isBanned', false);
                        this.$set(this.members[memberIndex], 'role', 'MEMBER');
                    }

                    // 如果是当前用户被解禁，更新全局状态
                    if (member.userId === this.currentUserId) {
                        this.isBanned = false;
                    }

                    alert(`${member.username} 已解除禁言`);
                    console.log('✅ 解禁操作完成 - role已恢复为member');
                } catch (error) {
                    console.error('解禁成员失败:', error);
                    alert('操作失败，请重试');
                }
            },

            // 移除成员（使用正确的接口地址）
            async removeMember(member) {
                if (!confirm(`确定要将 ${member.username} 移除出社群吗？此操作不可撤销！`)) return;

                try {
                    // 使用正确的接口地址和参数方式
                    await this.$axios.post('/api/community/applications/deleteMembers', null, {
                        params: {
                            communityId: this.communityId,
                            userId: member.userId
                        }
                    });

                    // 从本地数据中移除
                    this.members = this.members.filter(m => m.id !== member.id);

                    alert(`${member.username} 已被移除出社群`);
                    console.log('✅ 成员移除操作完成');
                } catch (error) {
                    console.error('移除成员失败:', error);
                    alert('操作失败，请重试');
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

            // ==================== 打卡任务相关方法 ====================
            
            // 创建打卡任务
            async submitTask() {
                if (!this.$refs.taskForm.validate()) {
                    return;
                }

                this.taskSubmitting = true;
                try {
                    console.log('🚀 正在创建打卡任务...');
                    
                    // 准备请求数据
                    const taskData = {
                        taskName: this.taskForm.taskName.trim(),
                        taskDescription: this.taskForm.taskDescription ? this.taskForm.taskDescription.trim() : '',
                        periodType: this.taskForm.periodType,
                        startDate: this.taskForm.startDate || this.getTodayDate()
                    };

                    console.log('📝 任务数据:', taskData);

                    // 发送创建请求
                    const response = await this.$axios.post(`/api/community/${this.communityId}/check-in/tasks`, taskData);

                    if (response.data.code === 1) {
                        console.log('✅ 任务创建成功:', response.data.data);
                        
                        // 显示成功消息
                        this.addNotification(`成功创建任务：${taskData.taskName}`);
                        
                        // 重新加载任务列表
                        await this.fetchCheckInTasks();
                        
                        // 重置表单并切换到任务列表
                        this.resetTaskForm();
                        this.checkInTab = 0;
                        
                        // 显示成功提示
                        this.$nextTick(() => {
                            alert('任务创建成功！');
                        });
                        
                    } else {
                        console.error('❌ 创建任务失败:', response.data.message);
                        alert('创建失败：' + (response.data.message || '未知错误'));
                    }
                } catch (error) {
                    console.error('❌ 创建任务异常:', error);
                    if (error.response) {
                        const message = error.response.data?.message || error.response.data?.msg || '创建失败';
                        alert('创建失败：' + message);
                    } else {
                        alert('创建失败：网络错误，请检查网络连接');
                    }
                } finally {
                    this.taskSubmitting = false;
                }
            },

            // 重置任务表单
            resetTaskForm() {
                this.taskForm = {
                    taskName: '',
                    taskDescription: '',
                    periodType: 'DAILY',
                    startDate: ''
                };
                this.editingTask = null;
                
                // 重置表单验证
                if (this.$refs.taskForm) {
                    this.$refs.taskForm.resetValidation();
                }
            },

            // 获取今天日期（YYYY-MM-DD格式）
            getTodayDate() {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            },

            // 格式化日期显示
            formatDate(dateString) {
                if (!dateString) return '未设置';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                } catch (error) {
                    return dateString;
                }
            },

            // 格式化周期类型
            formatPeriodType(type) {
                const typeMap = {
                    'DAILY': '每日',
                    'WEEKLY': '每周'
                };
                return typeMap[type] || type;
            },

            // 获取周期类型颜色
            getPeriodTypeColor(type) {
                const colorMap = {
                    'DAILY': 'blue',
                    'WEEKLY': 'green'
                };
                return colorMap[type] || 'grey';
            },

            // 获取任务状态颜色（修复版 - 适配数字状态）
            getTaskStatusColor(task) {
                // 如果用户今天已经打卡，显示成功色
                if (task.userStatus && task.userStatus.hasCheckedInToday) {
                    return 'success';
                }
                
                // 根据数字状态显示颜色
                if (task.status === 1 || task.status === 'ACTIVE') {
                    return 'primary';
                } else if (task.status === 0 || task.status === 'INACTIVE') {
                    return 'warning';
                } else {
                    return 'grey';
                }
            },

            // 获取任务状态图标（修复版 - 适配数字状态）
            getTaskStatusIcon(task) {
                // 如果用户今天已经打卡，显示完成图标
                if (task.userStatus && task.userStatus.hasCheckedInToday) {
                    return 'mdi-check-circle';
                }
                
                // 根据数字状态显示图标
                if (task.status === 1 || task.status === 'ACTIVE') {
                    return 'mdi-calendar-check';
                } else if (task.status === 0 || task.status === 'INACTIVE') {
                    return 'mdi-pause-circle';
                } else {
                    return 'mdi-calendar-remove';
                }
            },

            // 获取任务状态文本（修复版 - 适配数字状态）
            getTaskStatusText(task) {
                // 如果用户今天已经打卡
                if (task.userStatus && task.userStatus.hasCheckedInToday) {
                    return '今日已打卡';
                }
                
                // 根据数字状态显示文本
                const statusMap = {
                    1: '可以打卡',      // 1 = 任务启用
                    0: '已暂停',       // 0 = 任务停止
                    // 保留字符串兼容性（如果后端以后改回字符串）
                    'ACTIVE': '可以打卡',
                    'INACTIVE': '已暂停',
                    'COMPLETED': '已完成'
                };
                return statusMap[task.status] || '未知状态';
            },

            // 格式化参与人数显示
            formatParticipantCount(count) {
                if (!count) return '0人参与';
                return `${count}人参与`;
            },

            // 格式化今日打卡数显示
            formatTodayCheckInCount(count) {
                if (!count) return '今日无人打卡';
                return `今日${count}人打卡`;
            },

            // 检查用户是否可以打卡（修复版 - 适配数字状态）
            canUserCheckIn(task) {
                // 如果任务不是激活状态（1表示激活），不能打卡
                if (task.status !== 1 && task.status !== 'ACTIVE') {
                    return false;
                }
                
                // 如果用户今天已经打卡，不能再次打卡
                if (task.userStatus && task.userStatus.hasCheckedInToday) {
                    return false;
                }
                
                return true;
            },

            // 打开打卡表单
            openCheckInForm(task) {
                this.currentCheckInTask = task;
                this.checkInNotes = '';
                this.checkInFormDialog = true;
            },

            // 关闭打卡表单
            closeCheckInForm() {
                this.checkInFormDialog = false;
                this.currentCheckInTask = null;
                this.checkInNotes = '';
                this.checkInSubmitting = false;
            },

            // 提交打卡（更新接口地址）
            async submitCheckIn() {
                if (!this.currentCheckInTask) return;

                this.checkInSubmitting = true;
                try {
                    const checkInData = {
                        notes: this.checkInNotes.trim()
                    };

                    console.log('📝 提交打卡:', checkInData);
                    console.log('🎯 打卡任务:', this.currentCheckInTask);
                    
                    // 使用正确的打卡接口地址
                    const response = await this.$axios.post(
                        `/api/community/${this.communityId}/check-in/tasks/${this.currentCheckInTask.id}/check-in`, 
                        checkInData
                    );
                    
                    if (response.data.code === 1) {
                        console.log('✅ 打卡成功:', response.data.data);
                        this.addNotification('打卡成功！');
                        
                        // 显示服务器返回的成功消息
                        if (response.data.data) {
                            alert(response.data.data); // 显示 "打卡成功！记录正在保存中"
                        }
                        
                        // 关闭对话框
                        this.closeCheckInForm();
                        
                        // 刷新相关数据
                        setTimeout(async () => {
                            await Promise.all([
                                this.fetchCheckInTasks(), // 刷新任务列表
                                this.fetchMyCheckInStatus() // 刷新我的状态
                            ]);
                        }, 1000); // 延迟1秒后刷新，确保服务器数据已更新
                        
                    } else {
                        console.error('❌ 打卡失败:', response.data);
                        alert('打卡失败：' + (response.data.msg || response.data.message || '未知错误'));
                    }
                } catch (error) {
                    console.error('❌ 打卡失败:', error);
                    
                    if (error.response) {
                        const errorMsg = error.response.data?.msg || 
                                       error.response.data?.message || 
                                       `服务器错误 (${error.response.status})`;
                        alert('打卡失败：' + errorMsg);
                    } else if (error.request) {
                        alert('打卡失败：网络连接错误，请检查网络后重试');
                    } else {
                        alert('打卡失败：' + error.message);
                    }
                } finally {
                    this.checkInSubmitting = false;
                }
            },

            // ==================== 我的打卡状态相关方法 ====================
            
            // 获取我的打卡状态
            async fetchMyCheckInStatus() {
                this.myStatusLoading = true;
                try {
                    console.log('🔍 正在获取我的打卡状态...');
                    const response = await this.$axios.get(`/api/community/${this.communityId}/check-in/my-status`);

                    if (response.data.code === 1) {
                        this.myCheckInStatus = response.data.data || [];
                        console.log('✅ 我的打卡状态获取成功:', this.myCheckInStatus.length, '个任务');
                        console.log('📝 状态详情:', this.myCheckInStatus);
                    } else {
                        console.error('❌ 获取我的打卡状态失败:', response.data.message);
                        this.myCheckInStatus = [];
                    }
                } catch (error) {
                    console.error('❌ 获取我的打卡状态异常:', error);
                    this.myCheckInStatus = [];
                } finally {
                    this.myStatusLoading = false;
                }
            },

            // 获取参与任务总数
            getMyTotalTasks() {
                return this.myCheckInStatus.length;
            },

            // 获取今日已打卡任务数
            getMyTodayCheckIns() {
                return this.myCheckInStatus.filter(status => status.checkedInToday).length;
            },

            // 获取最长连续打卡天数
            getMyMaxConsecutive() {
                if (this.myCheckInStatus.length === 0) return 0;
                return Math.max(...this.myCheckInStatus.map(status => status.consecutiveDays));
            },

            // 获取本月总打卡次数
            getMyTotalThisMonth() {
                return this.myCheckInStatus.reduce((total, status) => total + status.totalCheckInsThisMonth, 0);
            },

            // 计算完成率
            calculateCompletionRate(status) {
                const currentDay = new Date().getDate();
                const monthDays = this.getCurrentMonthDays();
                
                // 如果是按天计算，使用当前日期作为分母
                // 如果是按周计算，需要调整逻辑
                const denominator = Math.min(currentDay, monthDays);
                
                if (denominator === 0) return 0;
                
                const rate = (status.totalCheckInsThisMonth / denominator) * 100;
                return Math.min(Math.round(rate), 100);
            },

            // 获取当前月份天数
            getCurrentMonthDays() {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                return new Date(year, month + 1, 0).getDate();
            },

            // 根据完成率获取进度条颜色
            getProgressColor(rate) {
                if (rate >= 80) return 'success';
                if (rate >= 60) return 'warning';
                if (rate >= 40) return 'orange';
                return 'error';
            },

            // 查看任务详情
            viewTaskDetails(status) {
                // 可以展开显示更详细的打卡历史
                console.log('查看任务详情:', status);
                // 这里可以添加一个详情对话框或者跳转到详情页面
                alert(`任务：${status.taskName}\n连续打卡：${status.consecutiveDays}天\n本月打卡：${status.totalCheckInsThisMonth}次`);
            },

            // 快速打卡
            quickCheckIn(status) {
                if (status.checkedInToday) return;
                
                // 找到对应的完整任务信息
                const fullTask = this.checkInTasks.find(task => task.id === status.taskId);
                if (fullTask) {
                    this.openCheckInForm(fullTask);
                } else {
                    alert('无法找到任务详情，请刷新页面后重试');
                }
            },

            // ==================== 任务管理相关方法 ====================

            // 切换任务状态（启用/停用）
            async toggleTaskStatus(task) {
                const newStatus = task.status === 1 ? 0 : 1;
                const actionText = newStatus === 1 ? '启用' : '停用';
                
                if (!confirm(`确定要${actionText}任务"${task.taskName}"吗？`)) {
                    return;
                }

                // 设置单个任务的更新状态
                this.$set(task, 'updating', true);
                
                try {
                    console.log(`🔄 正在${actionText}任务:`, task.taskName, '新状态:', newStatus);
                    
                    const response = await this.$axios.put(
                        `/api/community/${this.communityId}/check-in/tasks/${task.id}/status`,
                        null,
                        {
                            params: { status: newStatus }
                        }
                    );

                    if (response.data.code === 1) {
                        console.log(`✅ 任务${actionText}成功:`, response.data);
                        
                        // 更新本地任务状态
                        task.status = newStatus;
                        
                        // 显示成功消息
                        this.addNotification(`任务"${task.taskName}"已${actionText}`);
                        
                        // 刷新任务列表以获取最新数据
                        await this.fetchCheckInTasks();
                        
                    } else {
                        console.error(`❌ 任务${actionText}失败:`, response.data);
                        alert(`${actionText}失败：` + (response.data.message || response.data.msg || '未知错误'));
                    }
                } catch (error) {
                    console.error(`❌ 任务${actionText}异常:`, error);
                    
                    if (error.response) {
                        const errorMsg = error.response.data?.message || 
                                       error.response.data?.msg || 
                                       `服务器错误 (${error.response.status})`;
                        alert(`${actionText}失败：` + errorMsg);
                    } else {
                        alert(`${actionText}失败：网络错误，请检查网络连接`);
                    }
                } finally {
                    this.$set(task, 'updating', false);
                }
            },

            // 删除任务
            async deleteTask(task) {
                if (!confirm(`确定要删除任务"${task.taskName}"吗？\n\n注意：删除后所有相关的打卡记录也将被删除，此操作不可撤销！`)) {
                    return;
                }

                // 二次确认
                if (!confirm(`请再次确认删除任务"${task.taskName}"？`)) {
                    return;
                }

                // 设置单个任务的删除状态
                this.$set(task, 'deleting', true);
                
                try {
                    console.log('🗑️ 正在删除任务:', task.taskName);
                    
                    const response = await this.$axios.delete(
                        `/api/community/${this.communityId}/check-in/tasks/${task.id}`
                    );

                    if (response.data.code === 1) {
                        console.log('✅ 任务删除成功:', response.data);
                        
                        // 显示成功消息
                        this.addNotification(`任务"${task.taskName}"已删除`);
                        
                        // 从本地列表中移除任务
                        const taskIndex = this.checkInTasks.findIndex(t => t.id === task.id);
                        if (taskIndex !== -1) {
                            this.checkInTasks.splice(taskIndex, 1);
                        }
                        
                        // 刷新我的打卡状态（因为任务删除了）
                        await this.fetchMyCheckInStatus();
                        
                    } else {
                        console.error('❌ 任务删除失败:', response.data);
                        alert('删除失败：' + (response.data.message || response.data.msg || '未知错误'));
                    }
                } catch (error) {
                    console.error('❌ 任务删除异常:', error);
                    
                    if (error.response) {
                        const errorMsg = error.response.data?.message || 
                                       error.response.data?.msg || 
                                       `服务器错误 (${error.response.status})`;
                        alert('删除失败：' + errorMsg);
                    } else {
                        alert('删除失败：网络错误，请检查网络连接');
                    }
                } finally {
                    this.$set(task, 'deleting', false);
                }
            },

            // 编辑任务
            editTask(task) {
                console.log('📝 编辑任务:', task);
                
                // 填充表单数据
                this.taskForm = {
                    taskName: task.taskName,
                    taskDescription: task.taskDescription || '',
                    periodType: task.periodType,
                    startDate: task.startDate
                };
                
                // 设置编辑状态
                this.editingTask = task;
                
                // 切换到创建任务标签页（复用表单）
                this.checkInTab = 2;
                
                // 滚动到顶部
                this.$nextTick(() => {
                    const container = document.querySelector('.v-tabs-items');
                    if (container) {
                        container.scrollTop = 0;
                    }
                });
            },

            // 查看任务统计
            viewTaskStats(task) {
                console.log('📊 查看任务统计:', task);
                
                // 创建统计信息弹窗
                const statsInfo = [
                    `任务名称：${task.taskName}`,
                    `任务描述：${task.taskDescription || '无'}`,
                    `打卡周期：${this.formatPeriodType(task.periodType)}`,
                    `开始日期：${this.formatDate(task.startDate)}`,
                    `任务状态：${this.getTaskStatusText(task)}`,
                    `参与人数：${task.participantCount || 0}`,
                    `今日打卡：${task.todayCheckInCount || 0}`,
                    `创建时间：${this.formatDate(task.createdAt)}`,
                    `更新时间：${this.formatDate(task.updatedAt)}`
                ].join('\n');
                
                alert(`任务统计信息\n\n${statsInfo}`);
                
                // 这里可以扩展为一个详细的统计对话框
                // 显示打卡历史、参与用户列表、统计图表等
            },

            // ==================== 排行榜相关方法 ====================

            // 获取排行榜数据
            async fetchLeaderboard() {
                if (!this.selectedLeaderboardTaskId) {
                    this.leaderboard = [];
                    return;
                }

                this.leaderboardLoading = true;
                try {
                    console.log('🏆 正在获取排行榜数据...', this.selectedLeaderboardTaskId);
                    
                    const response = await this.$axios.get(
                        `/api/community/${this.communityId}/check-in/tasks/${this.selectedLeaderboardTaskId}/leaderboard`
                    );

                    if (response.data.code === 1) {
                        this.leaderboard = response.data.data || [];
                        console.log('✅ 排行榜数据获取成功:', this.leaderboard.length, '位用户');
                        console.log('📊 排行榜详情:', this.leaderboard);
                    } else {
                        console.error('❌ 获取排行榜失败:', response.data.message);
                        this.leaderboard = [];
                    }
                } catch (error) {
                    console.error('❌ 获取排行榜异常:', error);
                    this.leaderboard = [];
                } finally {
                    this.leaderboardLoading = false;
                }
            },

            // 刷新排行榜
            async refreshLeaderboard() {
                await this.fetchLeaderboard();
            },

            // 排序排行榜
            sortLeaderboard() {
                // 触发计算属性重新计算
                this.$forceUpdate();
            },

            // 获取前三名
            getTopThree() {
                return this.sortedLeaderboard.slice(0, 3);
            },

            // 获取我的排名信息
            getMyRankInfo() {
                return this.leaderboard.find(user => user.userId === this.currentUserId);
            },

            // 获取排名颜色
            getRankColor(rank) {
                switch (rank) {
                    case 1: return 'amber darken-2'; // 金色
                    case 2: return 'grey'; // 银色
                    case 3: return 'deep-orange darken-1'; // 铜色
                    default: return 'primary';
                }
            },

            // 获取排名图标
            getRankIcon(rank) {
                switch (rank) {
                    case 1: return '👑';
                    case 2: return '🥈';
                    case 3: return '🥉';
                    default: return rank;
                }
            },

            // 获取排名卡片样式
            getRankCardClass(rank) {
                switch (rank) {
                    case 1: return 'gold-card';
                    case 2: return 'silver-card';
                    case 3: return 'bronze-card';
                    default: return '';
                }
            },

            // 获取排名徽章样式
            getRankBadgeClass(rank) {
                switch (rank) {
                    case 1: return 'gold-badge';
                    case 2: return 'silver-badge';
                    case 3: return 'bronze-badge';
                    default: return '';
                }
            },

            // 获取排名数字样式
            getRankNumberClass(rank) {
                if (rank <= 3) return 'top-rank-number';
                return 'normal-rank-number';
            },

            // 格式化申请时间
            formatApplicationTime(timestamp) {
                if (!timestamp) return '未知时间';
                const date = new Date(timestamp);
                const now = new Date();
                const diff = now - date;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const days = Math.floor(hours / 24);

                if (hours < 1) {
                    return '刚刚申请';
                } else if (hours < 24) {
                    return `${hours}小时前申请`;
                } else if (days < 7) {
                    return `${days}天前申请`;
                } else {
                    return date.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }) + ' 申请';
                }
            },

            // 批量同意申请
            async batchApproveApplications() {
                if (!confirm(`确定要同意所有 ${this.pendingApplications.length} 个待审核申请吗？`)) return;

                try {
                    const promises = this.pendingApplications.map(application => 
                        this.reviewApplication(application.id, 'APPROVED')
                    );
                    
                    await Promise.all(promises);
                    console.log('✅ 批量同意申请完成');
                } catch (error) {
                    console.error('❌ 批量同意申请失败:', error);
                    alert('批量操作失败，请重试');
                }
            },

            // 批量拒绝申请
            async batchRejectApplications() {
                if (!confirm(`确定要拒绝所有 ${this.pendingApplications.length} 个待审核申请吗？此操作不可撤销！`)) return;

                try {
                    const promises = this.pendingApplications.map(application => 
                        this.reviewApplication(application.id, 'REJECTED')
                    );
                    
                    await Promise.all(promises);
                    console.log('✅ 批量拒绝申请完成');
                } catch (error) {
                    console.error('❌ 批量拒绝申请失败:', error);
                    alert('批量操作失败，请重试');
                }
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
        flex-shrink: 0;
        /* 防止用户名被压缩 */
    }

    .own-message-compact .message-time-compact {
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        font-weight: 500;
        flex-shrink: 0;
        /* 防止时间被压缩 */
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
        flex-shrink: 0;
        /* 防止用户名被压缩 */
    }

    .other-message-compact .message-time-compact {
        color: #6c757d;
        font-size: 11px;
        font-weight: 500;
        flex-shrink: 0;
        /* 防止时间被压缩 */
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
        flex-shrink: 0;
        /* 防止标签被压缩 */
    }

    /* 消息分隔符 - 固定间隙 */
    .message-separator {
        width: 16px;
        /* 固定宽度间隙 */
        display: inline-block;
        flex-shrink: 0;
        /* 防止压缩 */
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

    /* 任务完成样式 */
    .task-completed {
        background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%) !important;
        border: 2px solid #4caf50 !important;
    }

    .task-completed .v-card__title {
        background: rgba(76, 175, 80, 0.1);
    }

    /* 打卡统计信息样式 */
    .v-chip.v-size--x-small {
        font-size: 10px !important;
        height: 20px !important;
    }

    /* 个人状态统计样式 */
    .text-h6.font-weight-bold {
        font-size: 18px !important;
        line-height: 1.2;
    }

    .text-caption {
        font-size: 11px !important;
        line-height: 1.2;
    }

    /* 排行榜样式 */
    .gold-card {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
        color: white !important;
    }

    .silver-card {
        background: linear-gradient(135deg, #C0C0C0 0%, #808080 100%) !important;
        color: white !important;
    }

    .bronze-card {
        background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%) !important;
        color: white !important;
    }

    .rank-badge {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        z-index: 1;
    }

    .gold-badge {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
    }

    .silver-badge {
        background: linear-gradient(135deg, #C0C0C0, #808080);
        box-shadow: 0 2px 8px rgba(192, 192, 192, 0.5);
    }

    .bronze-badge {
        background: linear-gradient(135deg, #CD7F32, #B87333);
        box-shadow: 0 2px 8px rgba(205, 127, 50, 0.5);
    }

    .golden-border {
        border: 3px solid #FFD700 !important;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5) !important;
    }

    .rank-number {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 14px;
    }

    .top-rank-number {
        background: linear-gradient(135deg, #ff6b6b, #ffa726);
        color: white;
    }

    .normal-rank-number {
        background: #f5f5f5;
        color: #666;
    }

    .highlight-user {
        background-color: rgba(33, 150, 243, 0.1) !important;
        border-left: 4px solid #2196f3 !important;
    }

    /* 排行榜列表项样式 */
    .v-list-item.highlight-user .v-list-item__content {
        font-weight: 500;
    }

    /* 排行榜动画效果 */
    .gold-card, .silver-card, .bronze-card {
        transition: all 0.3s ease;
    }

    .gold-card:hover, .silver-card:hover, .bronze-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
</style>