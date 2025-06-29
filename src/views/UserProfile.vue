<template>
    <v-container class="user-profile">
        <!-- 个人信息头部区域 -->
        <v-row class="mb-6">
            <v-col cols="12">
                <v-card class="profile-header" elevation="4">
                    <v-card-text class="pa-6">
                        <v-row align="center">
                            <!-- 用户头像 -->
                            <v-col cols="12" md="3" class="text-center">
                                <v-avatar size="120" class="profile-avatar">
                                    <v-img :src="userInfo.avatarUrl || defaultAvatar" :alt="userInfo.username"></v-img>
                                </v-avatar>
                                <div class="mt-3">
                                    <v-btn 
                                        small 
                                        outlined 
                                        color="white" 
                                        @click="openEditDialog"
                                        v-if="isOwnProfile"
                                    >
                                        <v-icon left small>mdi-pencil</v-icon>
                                        编辑资料
                                    </v-btn>
                                </div>
                            </v-col>
                            
                            <!-- 用户基本信息 -->
                            <v-col cols="12" md="6">
                                <div class="user-info">
                                    <h2 class="text-h4 font-weight-bold mb-2">{{ userInfo.username || '用户' }}</h2>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.nickname">
                                        昵称：{{ userInfo.nickname }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.bio">
                                        <v-icon small class="mr-1">mdi-card-text</v-icon>
                                        {{ userInfo.bio }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.email">
                                        <v-icon small class="mr-1">mdi-email</v-icon>
                                        {{ userInfo.email }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.gender">
                                        <v-icon small class="mr-1">mdi-account</v-icon>
                                        {{ userInfo.gender }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.phone">
                                        <v-icon small class="mr-1">mdi-phone</v-icon>
                                        {{ userInfo.phone }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.birthday">
                                        <v-icon small class="mr-1">mdi-cake</v-icon>
                                        生日：{{ formatDate(userInfo.birthday) }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.school">
                                        <v-icon small class="mr-1">mdi-school</v-icon>
                                        {{ userInfo.school }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary mb-1" v-if="userInfo.region">
                                        <v-icon small class="mr-1">mdi-map-marker</v-icon>
                                        {{ userInfo.region }}
                                    </div>
                                    <div class="text-subtitle-1 text--secondary" v-if="userInfo.createdAt">
                                        <v-icon small class="mr-1">mdi-calendar</v-icon>
                                        注册时间：{{ formatDate(userInfo.createdAt) }}
                                    </div>
                                </div>
                            </v-col>
                            
                            <!-- 统计信息 -->
                            <v-col cols="12" md="3">
                                <v-row>
                                    <v-col cols="6" md="12" class="text-center mb-2">
                                        <div class="text-h3 font-weight-bold white--text">{{ joinedCommunities.length }}</div>
                                        <div class="text-caption">加入社群</div>
                                    </v-col>
                                    <v-col cols="6" md="12" class="text-center">
                                        <div class="text-h3 font-weight-bold white--text">{{ totalCheckInDays }}</div>
                                        <div class="text-caption">总打卡天数</div>
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- 内容区域 -->
        <v-row>
            <!-- 左侧：加入的社群 -->
            <v-col cols="12" md="6">
                <v-card class="mb-4" elevation="2">
                    <v-card-title class="pb-2">
                        <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
                        加入的社群
                        <v-spacer></v-spacer>
                        <v-chip small color="primary" outlined>{{ joinedCommunities.length }}</v-chip>
                    </v-card-title>
                    <v-card-text>
                        <div v-if="loading.communities" class="text-center py-4">
                            <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        </div>
                        <div v-else-if="joinedCommunities.length === 0" class="text-center py-6">
                            <v-icon large color="grey lighten-2">mdi-account-group-outline</v-icon>
                            <div class="text-body-1 grey--text mt-2">暂未加入任何社群</div>
                            <v-btn text color="primary" @click="$router.push('/FrontPage')" class="mt-2">
                                <v-icon left>mdi-compass</v-icon>
                                发现社群
                            </v-btn>
                        </div>
                        <div v-else>
                            <v-list dense>
                                <v-list-item 
                                    v-for="community in joinedCommunities" 
                                    :key="community.id"
                                    @click="$router.push(`/community/${community.id}`)"
                                    class="community-item"
                                >
                                    <v-list-item-avatar>
                                        <v-img :src="community.avatarUrl || defaultAvatar"></v-img>
                                    </v-list-item-avatar>
                                    <v-list-item-content>
                                        <v-list-item-title class="font-weight-medium">
                                            {{ community.name }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>
                                            {{ community.memberCount }}名成员
                                        </v-list-item-subtitle>
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <v-chip 
                                            x-small 
                                            :color="getRoleColor(community.userRole)" 
                                            :text-color="getRoleColor(community.userRole) === 'red' ? 'white' : 'black'"
                                            :outlined="getRoleColor(community.userRole) !== 'red'"
                                        >
                                            {{ formatRole(community.userRole) }}
                                        </v-chip>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-list>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- 右侧：打卡统计 -->
            <v-col cols="12" md="6">
                <v-card elevation="2">
                    <v-card-title class="pb-2">
                        <v-icon class="mr-2" color="success">mdi-calendar-check</v-icon>
                        打卡统计
                        <v-spacer></v-spacer>
                        <v-btn icon small @click="refreshCheckInStats">
                            <v-icon>mdi-refresh</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-text>
                        <div v-if="loading.checkIns" class="text-center py-4">
                            <v-progress-circular indeterminate color="success"></v-progress-circular>
                        </div>
                        <div v-else-if="checkInStats.length === 0" class="text-center py-6">
                            <v-icon large color="grey lighten-2">mdi-calendar-check-outline</v-icon>
                            <div class="text-body-1 grey--text mt-2">暂无打卡记录</div>
                        </div>
                        <div v-else>
                            <!-- 总体统计 -->
                            <v-row class="mb-4">
                                <v-col cols="4" class="text-center">
                                    <div class="text-h5 font-weight-bold success--text">{{ maxConsecutiveDays }}</div>
                                    <div class="text-caption">最长连续</div>
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <div class="text-h5 font-weight-bold info--text">{{ thisMonthTotal }}</div>
                                    <div class="text-caption">本月打卡</div>
                                </v-col>
                                <v-col cols="4" class="text-center">
                                    <div class="text-h5 font-weight-bold primary--text">{{ participatingTasks }}</div>
                                    <div class="text-caption">参与任务</div>
                                </v-col>
                            </v-row>

                            <!-- 任务详细统计 -->
                            <v-divider class="mb-3"></v-divider>
                            <div class="text-subtitle-2 font-weight-medium mb-2">任务详情</div>
                            <v-list dense>
                                <v-list-item v-for="stat in checkInStats" :key="stat.taskId" class="px-0">
                                    <v-list-item-content>
                                        <v-list-item-title class="text-body-2">
                                            {{ stat.taskName }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle class="text-caption">
                                            {{ stat.communityName }}
                                        </v-list-item-subtitle>
                                    </v-list-item-content>
                                    <v-list-item-action class="d-flex flex-row align-center">
                                        <div class="text-center mx-1">
                                            <div class="text-body-2 font-weight-bold primary--text">
                                                {{ stat.consecutiveDays }}
                                            </div>
                                            <div class="text-caption">连续</div>
                                        </div>
                                        <div class="text-center mx-1">
                                            <div class="text-body-2 font-weight-bold success--text">
                                                {{ stat.totalCheckInsThisMonth }}
                                            </div>
                                            <div class="text-caption">本月</div>
                                        </div>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-list>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- 编辑资料对话框 -->
        <v-dialog v-model="editDialog" max-width="600px" persistent>
            <v-card>
                <v-card-title>
                    <v-icon class="mr-2">mdi-account-edit</v-icon>
                    编辑个人资料
                </v-card-title>
                <v-card-text>
                    <v-form ref="editForm" v-model="editFormValid">
                        <v-container>
                            <!-- 头像上传 -->
                            <v-row>
                                <v-col cols="12" class="text-center">
                                    <v-avatar size="80" class="mb-3">
                                        <v-img :src="editForm.avatarUrl || defaultAvatar"></v-img>
                                    </v-avatar>
                                    <div>
                                        <input
                                            ref="avatarInput"
                                            type="file"
                                            accept="image/*"
                                            style="display: none"
                                            @change="handleAvatarUpload"
                                        />
                                        <v-btn 
                                            small 
                                            outlined 
                                            color="primary" 
                                            @click="$refs.avatarInput.click()"
                                            :loading="uploadingAvatar"
                                        >
                                            <v-icon left small>mdi-camera</v-icon>
                                            更换头像
                                        </v-btn>
                                    </div>
                                </v-col>
                            </v-row>

                            <!-- 基本信息 -->
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-text-field
                                        v-model="editForm.username"
                                        label="用户名"
                                        outlined
                                        dense
                                        readonly
                                        hint="用户名不可修改"
                                        persistent-hint
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field
                                        v-model="editForm.nickname"
                                        label="昵称"
                                        outlined
                                        dense
                                        maxlength="20"
                                        counter
                                    ></v-text-field>
                                </v-col>
                            </v-row>

                            <!-- 个人简介 -->
                            <v-row>
                                <v-col cols="12">
                                    <v-textarea
                                        v-model="editForm.bio"
                                        label="个人简介"
                                        outlined
                                        dense
                                        rows="3"
                                        maxlength="200"
                                        counter
                                        hint="简单介绍一下自己"
                                    ></v-textarea>
                                </v-col>
                            </v-row>

                            <!-- 联系方式 -->
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-text-field
                                        v-model="editForm.email"
                                        label="邮箱"
                                        outlined
                                        dense
                                        type="email"
                                        :rules="emailRules"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field
                                        v-model="editForm.phone"
                                        label="手机号"
                                        outlined
                                        dense
                                        :rules="phoneRules"
                                    ></v-text-field>
                                </v-col>
                            </v-row>

                            <!-- 个人信息 -->
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-select
                                        v-model="editForm.gender"
                                        :items="genderOptions"
                                        label="性别"
                                        outlined
                                        dense
                                    ></v-select>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field
                                        v-model="editForm.birthday"
                                        label="生日"
                                        outlined
                                        dense
                                        type="date"
                                        hint="YYYY-MM-DD格式"
                                    ></v-text-field>
                                </v-col>
                            </v-row>

                            <!-- 教育和地区信息 -->
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-text-field
                                        v-model="editForm.school"
                                        label="学校"
                                        outlined
                                        dense
                                        maxlength="50"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field
                                        v-model="editForm.region"
                                        label="地区"
                                        outlined
                                        dense
                                        maxlength="50"
                                    ></v-text-field>
                                </v-col>
                            </v-row>

                            <!-- 密码修改 -->
                            <v-row>
                                <v-col cols="12">
                                    <v-text-field
                                        v-model="editForm.password"
                                        label="新密码（留空则不修改）"
                                        outlined
                                        dense
                                        :type="showPassword ? 'text' : 'password'"
                                        :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                        @click:append="showPassword = !showPassword"
                                        :rules="passwordRules"
                                        hint="至少6位字符"
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="cancelEdit">取消</v-btn>
                    <v-btn 
                        color="primary" 
                        :loading="saving"
                        :disabled="!editFormValid"
                        @click="saveProfile"
                    >
                        保存
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
export default {
    name: 'UserProfile',
    data() {
        return {
            userInfo: {},
            joinedCommunities: [],
            checkInStats: [],
            editDialog: false,
            editFormValid: false,
            saving: false,
            uploadingAvatar: false,
            showPassword: false,
            defaultAvatar: 'https://cdn.vuetifyjs.com/images/avatars/avatar-10.png',
            
            loading: {
                profile: true,
                communities: true,
                checkIns: true
            },

            editForm: {
                username: '',
                nickname: '',
                email: '',
                gender: '',
                phone: '',
                avatarUrl: '',
                bio: '',
                birthday: '',
                school: '',
                region: '',
                password: ''
            },

            genderOptions: [
                { text: '男', value: '男' },
                { text: '女', value: '女' },
                { text: '其他', value: '其他' }
            ],

            emailRules: [
                v => !v || /.+@.+\..+/.test(v) || '邮箱格式不正确'
            ],

            phoneRules: [
                v => !v || /^1[3-9]\d{9}$/.test(v) || '手机号格式不正确'
            ],

            passwordRules: [
                v => !v || v.length >= 6 || '密码至少需要6位字符'
            ]
        };
    },

    computed: {
        userId() {
            return this.$route.params.id || 'me';
        },
        isOwnProfile() {
            return this.userId === 'me' || this.userId == this.userInfo.userId;
        },
        totalCheckInDays() {
            return this.checkInStats.reduce((total, stat) => total + (stat.totalDays || 0), 0);
        },
        maxConsecutiveDays() {
            return Math.max(...this.checkInStats.map(stat => stat.consecutiveDays || 0), 0);
        },
        thisMonthTotal() {
            return this.checkInStats.reduce((total, stat) => total + (stat.totalCheckInsThisMonth || 0), 0);
        },
        participatingTasks() {
            return this.checkInStats.length;
        }
    },

    async created() {
        await this.fetchUserProfile();
        await this.fetchJoinedCommunities();
        await this.fetchCheckInStats();
    },

    methods: {
        // 获取用户资料
        async fetchUserProfile() {
            this.loading.profile = true;
            try {
                console.log('🔍 获取用户资料...');
                const endpoint = this.userId === 'me' ? '/api/users/me' : `/api/users/${this.userId}`;
                const response = await this.$axios.get(endpoint);

                if (response.data.code === 1) {
                    this.userInfo = response.data.data;
                    console.log('✅ 用户资料获取成功:', this.userInfo);
                } else {
                    throw new Error(response.data.message || '获取用户信息失败');
                }
            } catch (error) {
                console.error('❌ 获取用户资料失败:', error);
                alert('获取用户信息失败');
                this.$router.push('/FrontPage');
            } finally {
                this.loading.profile = false;
            }
        },

        // 获取加入的社群列表 - 优化版
        async fetchJoinedCommunities() {
            this.loading.communities = true;
            try {
                console.log('🔍 获取用户加入的社群...');
                
                const response = await this.$axios.get('/api/community/list?page=1&size=100');
                
                if (response.status === 200 && response.data.records) {
                    const communities = response.data.records;
                    const userCommunities = [];
                    
                    for (const community of communities) {
                        try {
                            // 🔥 1. 检查用户是否为成员
                            const membersResponse = await this.$axios.get(`/api/community/members/${community.id}`);
                            if (membersResponse.data.code === 1) {
                                const members = membersResponse.data.data;
                                const userMember = members.find(member => 
                                    member.userId === this.userInfo.userId
                                );
                                
                                if (userMember) {
                                    // 🔥 2. 获取社群详细信息（包含准确的成员数量）
                                    try {
                                        const detailResponse = await this.$axios.get(`/api/community/${community.id}`);
                                        if (detailResponse.data.code === 1) {
                                            const detailData = detailResponse.data.data;
                                            userCommunities.push({
                                                ...detailData, // 使用详细数据，包含准确的memberCount
                                                userRole: userMember.role
                                            });
                                        } else {
                                            // 如果详情接口失败，回退到使用成员列表长度
                                            userCommunities.push({
                                                ...community,
                                                userRole: userMember.role,
                                                memberCount: members.length
                                            });
                                        }
                                    } catch (detailError) {
                                        console.warn('获取社群详情失败，使用成员列表长度:', community.id);
                                        userCommunities.push({
                                            ...community,
                                            userRole: userMember.role,
                                            memberCount: members.length
                                        });
                                    }
                                }
                            }
                        } catch (err) {
                            console.warn('检查社群成员失败:', community.id, err);
                        }
                    }
                    
                    this.joinedCommunities = userCommunities;
                    console.log('✅ 用户社群列表获取成功:', this.joinedCommunities);
                }
            } catch (error) {
                console.error('❌ 获取用户社群失败:', error);
                this.joinedCommunities = [];
            } finally {
                this.loading.communities = false;
            }
        },

        // 获取打卡统计
        async fetchCheckInStats() {
            this.loading.checkIns = true;
            try {
                console.log('🔍 获取用户打卡统计...');
                // 获取用户参与的所有打卡任务统计
                const stats = [];
                
                for (const community of this.joinedCommunities) {
                    try {
                        // 获取该社群的打卡状态
                        const response = await this.$axios.get(`/api/community/${community.id}/check-in/my-status`);
                        if (response.data.code === 1 && response.data.data) {
                            const communityStats = response.data.data.map(stat => ({
                                ...stat,
                                communityName: community.name,
                                communityId: community.id
                            }));
                            stats.push(...communityStats);
                        }
                    } catch (err) {
                        console.warn('获取社群打卡统计失败:', community.id, err);
                    }
                }
                
                this.checkInStats = stats;
                console.log('✅ 打卡统计获取成功:', this.checkInStats);
            } catch (error) {
                console.error('❌ 获取打卡统计失败:', error);
                this.checkInStats = [];
            } finally {
                this.loading.checkIns = false;
            }
        },

        // 刷新打卡统计
        async refreshCheckInStats() {
            await this.fetchCheckInStats();
        },

        // 打开编辑对话框
        openEditDialog() {
            this.editForm = {
                username: this.userInfo.username || '',
                nickname: this.userInfo.nickname || '',
                email: this.userInfo.email || '',
                gender: this.userInfo.gender || '',
                phone: this.userInfo.phone || '',
                avatarUrl: this.userInfo.avatarUrl || '',
                bio: this.userInfo.bio || '',
                birthday: this.userInfo.birthday || '',
                school: this.userInfo.school || '',
                region: this.userInfo.region || '',
                password: ''
            };
            this.editDialog = true;
        },

        // 取消编辑
        cancelEdit() {
            this.editDialog = false;
            this.editForm = {};
        },

        // 保存资料
        async saveProfile() {
            if (!this.$refs.editForm.validate()) return;

            this.saving = true;
            try {
                console.log('💾 保存用户资料...', this.editForm);
                
                const updateData = {
                    nickname: this.editForm.nickname,
                    email: this.editForm.email,
                    gender: this.editForm.gender,
                    phone: this.editForm.phone,
                    bio: this.editForm.bio,
                    birthday: this.editForm.birthday,
                    school: this.editForm.school,
                    region: this.editForm.region
                };

                if (this.editForm.avatarUrl && this.editForm.avatarUrl !== this.userInfo.avatarUrl) {
                    updateData.avatarUrl = this.editForm.avatarUrl;
                }

                if (this.editForm.password && this.editForm.password.trim()) {
                    updateData.password = this.editForm.password;
                }

                const response = await this.$axios.put(`/api/users/${this.userInfo.userId}`, updateData);

                if (response.data.code === 200 || response.status === 200) {
                    console.log('✅ 资料保存成功');
                    this.$root.$showSnackbar('资料保存成功！', 'success');
                    this.editDialog = false;
                    await this.fetchUserProfile(); // 重新获取用户信息
                } else {
                    throw new Error(response.data.message || '保存失败');
                }
            } catch (error) {
                console.error('❌ 保存资料失败:', error);
                this.$root.$showSnackbar('保存失败：' + (error.response?.data?.message || error.message), 'error');
            } finally {
                this.saving = false;
            }
        },

        // 处理头像上传
        async handleAvatarUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // 验证文件类型和大小
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件！');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('图片大小不能超过10MB！');
                return;
            }

            this.uploadingAvatar = true;
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await this.$axios.post('/api/common/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.code === 1) {
                    this.editForm.avatarUrl = response.data.data;
                    console.log('✅ 头像上传成功');
                } else {
                    throw new Error(response.data.message || '上传失败');
                }
            } catch (error) {
                console.error('❌ 头像上传失败:', error);
                alert('头像上传失败：' + (error.response?.data?.message || error.message));
            } finally {
                this.uploadingAvatar = false;
                event.target.value = '';
            }
        },

        // 格式化日期
        formatDate(dateString) {
            if (!dateString) return '';
            return new Date(dateString).toLocaleDateString('zh-CN');
        },

        // 格式化角色
        formatRole(role) {
            const roleMap = {
                'owner': '群主',
                'admin': '管理员',
                'member': '成员',
                'OWNER': '群主',
                'ADMIN': '管理员',
                'MEMBER': '成员'
            };
            return roleMap[role] || role;
        },

        // 获取角色颜色
        getRoleColor(role) {
            const colorMap = {
                'owner': 'red',
                'admin': 'orange',
                'member': 'blue',
                'OWNER': 'red',
                'ADMIN': 'orange',
                'MEMBER': 'blue'
            };
            return colorMap[role] || 'grey';
        }
    }
};
</script>

<style scoped>
.user-profile {
    max-width: 1200px;
    margin: 0 auto;
}

.profile-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.profile-header .v-card__text {
    color: white;
}

.profile-avatar {
    border: 4px solid white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.user-info h2 {
    color: white;
}

.user-info .text--secondary {
    color: rgba(255,255,255,0.8) !important;
}

.community-item {
    border-radius: 8px;
    margin-bottom: 4px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.community-item:hover {
    background-color: rgba(25, 118, 210, 0.08);
    transform: translateX(4px);
}

.text-h3 {
    line-height: 1.2;
}

.text-caption {
    opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .profile-header .v-card__text {
        padding: 16px !important;
    }
    
    .user-info h2 {
        font-size: 1.5rem !important;
    }
}
</style> 