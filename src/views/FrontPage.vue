<template>
    <v-container>
     

        <!-- 分类标签页 -->
        <v-tabs v-model="selectedCategoryTab" background-color="transparent" color="primary" class="mb-4">
            <v-tab key="all">全部</v-tab>
            <v-tab v-for="category in categoryList" :key="category.id">
                {{ category.name }}
            </v-tab>
        </v-tabs>
        <!-- 顶部搜索框 -->
        <v-row class="mb-4 justify-center">
            <v-col cols="10" >
                <v-text-field v-model="searchQuery" label="搜索社群" placeholder="搜索社群名称或描述..." prepend-inner-icon="mdi-magnify"
                    clearable outlined dense @input="handleSearch"></v-text-field>
            </v-col>
        </v-row>

        <!-- 搜索结果提示 -->
        <v-row v-if="searchQuery && !loading" class="mb-2">
            <v-col cols="12">
                <v-chip color="info" outlined small>
                    <v-icon left small>mdi-information</v-icon>
                    找到 {{ filteredCommunities.length }} 个匹配的社群
                </v-chip>
                <v-btn 
                    v-if="searchQuery" 
                    text 
                    small 
                    color="primary" 
                    @click="clearSearch"
                    class="ml-2"
                >
                    <v-icon left small>mdi-close</v-icon>
                    清除搜索
                </v-btn>
            </v-col>
        </v-row>

        <!-- 社群列表：一行三个，一页三行九个 -->
        <div v-if="!loading">
            <!-- 当前页的社群 -->
            <v-row>
                <v-col v-for="community in paginatedCommunities" :key="community.id" cols="12" sm="4" md="4">
                    <v-card class="mx-auto" hover elevation="2" height="350">
                        <v-img 
                            height="160px" 
                            :src="community.avatarUrl || 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg'"
                        >
                        </v-img>

                        <v-card-title class="font-weight-bold text-subtitle-1" style="line-height: 1.2;">
                            <!-- 高亮显示搜索关键词 -->
                            <span v-html="highlightSearchText(community.name)"></span>
                        </v-card-title>
                        
                        <v-card-text class="pb-2" style="height: 100px; overflow: hidden;">
                            <!-- 高亮显示搜索关键词 -->
                            <div class="text-body-2 text--secondary" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                <span v-html="highlightSearchText(community.description)"></span>
                            </div>
                            <!-- 标签区域：分类和类型 -->
                            <div class="mt-2">
                                <!-- 分类标签 -->
                                <v-chip small color="primary" outlined class="mr-1">
                                    <v-icon left small>mdi-tag</v-icon>
                                    {{ community.categoryName }}
                                </v-chip>
                                <!-- 类型标签 - 使用#号显示 -->
                                <v-chip small color="indigo" outlined>
                                    #{{ formatCommunityType(community.type) }}
                                </v-chip>
                            </div>
                        </v-card-text>

                        <v-card-actions class="pt-0">
                            <v-btn 
                                text 
                                color="primary" 
                                small 
                                @click="checkMembershipAndEnter(community.id)"
                                :loading="community.checking"
                            >
                                <v-icon left small>mdi-chat</v-icon>
                                进入群聊
                            </v-btn>
                            <v-spacer></v-spacer>
                            <v-btn color="primary" small depressed @click="openJoinDialog(community)">
                                申请加入
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 如果没有找到匹配的社群 -->
            <v-row v-if="paginatedCommunities.length === 0" class="justify-center">
                <v-col cols="12" class="text-center">
                    <v-icon size="64" color="grey lighten-2">
                        {{ searchQuery ? 'mdi-magnify' : 'mdi-folder-open' }}
                    </v-icon>
                    <div class="text-h6 grey--text mt-2">
                        {{ searchQuery ? `没有找到包含 "${searchQuery}" 的社群` : '暂无社群' }}
                    </div>
                    <v-btn 
                        v-if="searchQuery" 
                        text 
                        color="primary" 
                        @click="clearSearch"
                        class="mt-2"
                    >
                        清除搜索条件
                    </v-btn>
                </v-col>
            </v-row>
        </div>

        <!-- 加载指示器 -->
        <v-row v-else class="justify-center mt-16">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </v-row>

        <!-- 分页组件 -->
        <v-row class="justify-center mt-6" v-if="!loading && totalPages > 1">
            <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                @input="handlePageChange"
            ></v-pagination>
        </v-row>

        <!-- 创建社群：悬浮按钮 -->
        <v-btn 
            fab 
            color="primary" 
            fixed 
            bottom 
            right 
            large 
            @click="createDialog = true"
            style="bottom: 80px; right: 80px;"
        >
            <v-icon>mdi-plus</v-icon>
        </v-btn>

        <!-- 创建社群对话框 -->
        <v-dialog v-model="createDialog" persistent max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">创建新社群</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <!-- 社群名称 -->
                        <v-text-field 
                            v-model="newCommunity.name" 
                            label="社群名称*" 
                            required
                            hint="请输入简洁明了的社群名称"
                            prepend-icon="mdi-account-group"
                        ></v-text-field>
                        
                        <!-- 社群描述 -->
                        <v-textarea 
                            v-model="newCommunity.description" 
                            label="社群描述*" 
                            required 
                            rows="3"
                            hint="介绍社群的目的和内容"
                            prepend-icon="mdi-text-box"
                        ></v-textarea>
                        
                        <!-- 头像上传区域 -->
                        <div class="mb-4">
                            <div class="d-flex align-center mb-2">
                                <v-icon class="mr-3" color="rgba(0,0,0,.54)">mdi-camera</v-icon>
                                <label class="text-body-1 font-weight-medium">社群封面</label>
                            </div>
                            <div class="d-flex align-center" style="margin-left: 40px;">
                                <!-- 预览图片 -->
                                <v-avatar size="80" class="mr-4">
                                    <v-img 
                                        v-if="newCommunity.avatarUrl" 
                                        :src="newCommunity.avatarUrl"
                                        :alt="newCommunity.name"
                                    ></v-img>
                                    <v-icon v-else size="40" color="grey lighten-1">mdi-account-group</v-icon>
                                </v-avatar>
                                
                                <!-- 上传按钮 -->
                                <div>
                                    <input
                                        ref="avatarInput"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp"
                                        style="display: none"
                                        @change="handleAvatarUpload"
                                    />
                                    <v-btn 
                                        color="primary" 
                                        outlined 
                                        small 
                                        @click="$refs.avatarInput.click()"
                                        :loading="uploadingAvatar"
                                    >
                                        <v-icon left small>mdi-upload</v-icon>
                                        {{ uploadingAvatar ? '上传中...' : '选择图片' }}
                                    </v-btn>
                                    <v-btn 
                                        v-if="newCommunity.avatarUrl" 
                                        text 
                                        small 
                                        color="error" 
                                        @click="removeAvatar"
                                        class="ml-2"
                                    >
                                        <v-icon left small>mdi-delete</v-icon>
                                        删除
                                    </v-btn>
                                </div>
                            </div>
                            <div class="text-caption text--secondary" style="margin-left: 40px;">
                                支持 JPG、PNG、GIF、BMP、WebP 格式，建议尺寸 200x200 像素，大小不超过 10MB
                            </div>
                        </div>
                        
                        <!-- 社群类型 -->
                        <v-select 
                            v-model="newCommunity.type" 
                            :items="communityTypeOptions" 
                            label="社群类型*" 
                            required
                            hint="选择适合的社群类型"
                            prepend-icon="mdi-tag"
                        ></v-select>
                        
                        <!-- 社群分类 -->
                        <v-select 
                            v-model="newCommunity.categoryId" 
                            :items="categorySelectItems" 
                            label="社群分类*" 
                            required
                            hint="选择社群所属分类"
                            prepend-icon="mdi-folder"
                        ></v-select>
                    </v-container>
                    <small>*表示必填字段</small>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="createDialog = false">取消</v-btn>
                    <v-btn color="blue darken-1" text @click="handleCreateCommunity">创建</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 申请加入社群对话框 -->
        <v-dialog v-model="joinDialog" persistent max-width="500px">
            <v-card>
                <v-card-title>
                    <span class="text-h5">申请加入 "{{ communityToJoin.name }}"</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-textarea 
                            v-model="joinApplication.reason" 
                            label="申请理由" 
                            auto-grow 
                            rows="2"
                            placeholder="请简要说明您的申请理由..."
                        ></v-textarea>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="joinDialog = false">取消</v-btn>
                    <v-btn color="blue darken-1" text @click="handleJoinCommunity">提交申请</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
    export default {
        name: "FrontPage",
        data: () => ({
            loading: true,
            allCommunities: [], // 存储所有社群数据
            categoryList: [], // 存储分类列表
            selectedCategoryTab: 0, // 当前选中的分类标签（0表示全部）
            searchQuery: '', // 搜索关键词
            
            // 分页相关
            currentPage: 1,
            itemsPerPage: 9, // 每页9个
            
            // Dialog control
            createDialog: false,
            joinDialog: false,
            uploadingAvatar: false,

            // Form data
            newCommunity: {
                name: '',
                description: '',
                avatarUrl: '',
                type: '',
                categoryId: null,
            },
            joinApplication: {
                communityId: null,
                reason: '我希望能加入这个社群，和大家一起学习进步！',
            },
            communityToJoin: {}, // To display name in join dialog
            
            // 社群类型选项
            communityTypeOptions: [
                { text: '学习社群', value: 'study' },
                { text: '工作社群', value: 'work' },
                { text: '兴趣爱好', value: 'hobby' },
                { text: '技术交流', value: 'tech' },
                { text: '生活分享', value: 'life' },
                { text: '其他', value: 'other' }
            ],
        }),
        
        computed: {
            // 根据选中的分类和搜索关键词过滤社群
            filteredCommunities() {
                let communities = this.allCommunities;
                
                // 首先按分类过滤
                if (this.selectedCategoryTab !== 0) {
                    const selectedCategory = this.categoryList[this.selectedCategoryTab - 1];
                    communities = communities.filter(c => c.categoryId === selectedCategory.id);
                }
                
                // 然后按搜索关键词过滤（只搜索名称和描述）
                if (this.searchQuery && this.searchQuery.trim() !== '') {
                    const query = this.searchQuery.trim().toLowerCase();
                    communities = communities.filter(c => 
                        c.name.toLowerCase().includes(query) || 
                        c.description.toLowerCase().includes(query)
                    );
                }
                
                return communities;
            },
            
            // 总页数
            totalPages() {
                return Math.ceil(this.filteredCommunities.length / this.itemsPerPage);
            },
            
            // 当前页显示的社群
            paginatedCommunities() {
                const start = (this.currentPage - 1) * this.itemsPerPage;
                const end = start + this.itemsPerPage;
                return this.filteredCommunities.slice(start, end);
            },
            
            // 分类选择器选项（用于创建社群时选择分类）
            categorySelectItems() {
                return this.categoryList.map(cat => ({
                    text: cat.name,
                    value: cat.id
                }));
            }
        },
        
        watch: {
            // 当分类标签改变或搜索关键词改变时，重置到第一页
            selectedCategoryTab() {
                this.currentPage = 1;
            },
            searchQuery() {
                this.currentPage = 1;
            }
        },
        
        created() {
            this.fetchData();
        },
        
        methods: {
            // 获取所有数据
            async fetchData() {
                this.loading = true;
                try {
                    // 并行获取分类列表和社群列表
                    const [categoriesResponse, communitiesResponse] = await Promise.all([
                        this.$axios.get('/api/community/categories'),
                        this.$axios.get('/api/community/list?page=1&size=1000') // 获取大量数据，在前端分页
                    ]);
                    
                    // 处理分类数据
                    if (categoriesResponse.data.code === 1) {
                        this.categoryList = categoriesResponse.data.data;
                        console.log('✅ 成功获取分类列表:', this.categoryList);
                    }
                    
                    // 处理社群数据
                    if (communitiesResponse.status === 200 && communitiesResponse.data.records) {
                        this.allCommunities = communitiesResponse.data.records;
                        console.log('✅ 成功获取社群列表，共', this.allCommunities.length, '个社群');
                    }
                    
                } catch (error) {
                    console.error("获取数据错误:", error);
                    alert('网络错误，无法加载数据。');
                } finally {
                    this.loading = false;
                }
            },
            
            // 搜索处理
            handleSearch() {
                // 搜索时重置到第一页
                this.currentPage = 1;
            },
            
            // 清除搜索
            clearSearch() {
                this.searchQuery = '';
                this.currentPage = 1;
            },
            
            // 高亮搜索关键词
            highlightSearchText(text) {
                if (!this.searchQuery || !text) {
                    return text;
                }
                
                const query = this.searchQuery.trim();
                if (query === '') {
                    return text;
                }
                
                // 使用正则表达式进行全局不区分大小写的替换
                const regex = new RegExp(`(${query})`, 'gi');
                return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 1px 2px;">$1</mark>');
            },
            
            // 分页变化处理
            handlePageChange(page) {
                this.currentPage = page;
                // 滚动到顶部
                this.$vuetify.goTo(0, { duration: 300 });
            },
            
            // 注释掉原来的直接跳转方法
            // viewCommunity(communityId) {
            //     this.$router.push(`/community/${communityId}`);
            // },
            
            openJoinDialog(community) {
                this.communityToJoin = community;
                this.joinApplication.communityId = community.id;
                this.joinDialog = true;
            },
            
            async handleJoinCommunity() {
                if (!this.joinApplication.communityId) return;
                try {
                    const response = await this.$axios.post(`/api/community/applications/apply?communityId=${this.joinApplication.communityId}&reason=${encodeURIComponent(this.joinApplication.reason)}`);
                    console.log('申请加入响应:', response.data);
                    
                    if (response.status === 200) {
                        alert('申请已成功提交！');
                        this.joinDialog = false;
                    } else {
                        alert('申请失败');
                    }
                } catch (error) {
                    console.error("申请加入社群错误:", error);
                    alert('网络错误，申请失败。');
                }
            },
            
            async handleCreateCommunity() {
                // 验证必填字段
                if (!this.newCommunity.name || !this.newCommunity.description || 
                    !this.newCommunity.type || !this.newCommunity.categoryId) {
                    alert('请填写所有必填字段！');
                    return;
                }
                
                try {
                    const requestData = {
                        name: this.newCommunity.name,
                        description: this.newCommunity.description,
                        type: this.newCommunity.type,
                        categoryId: this.newCommunity.categoryId
                    };
                    
                    // 只有当avatarUrl不为空时才添加到请求中
                    if (this.newCommunity.avatarUrl && this.newCommunity.avatarUrl.trim() !== '') {
                        requestData.avatarUrl = this.newCommunity.avatarUrl.trim();
                    }
                    
                    console.log('创建社群请求数据:', requestData);
                    
                    const response = await this.$axios.post('/api/community/create', requestData);
                    console.log('创建社群响应:', response.data);
                    
                    if (response.status === 200) {
                        alert('社群创建成功！');
                        this.createDialog = false;
                        // 重置表单
                        this.newCommunity = { 
                            name: '', 
                            description: '', 
                            avatarUrl: '', 
                            type: '', 
                            categoryId: null 
                        };
                        this.fetchData(); // 重新获取数据
                    } else {
                        alert('创建失败');
                    }
                } catch (error) {
                    console.error("创建社群错误:", error);
                    if (error.response && error.response.data && error.response.data.message) {
                        alert('创建失败：' + error.response.data.message);
                    } else {
                        alert('网络错误，创建失败。');
                    }
                }
            },
            
            // 格式化社群类型显示
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
            
            // 处理头像上传 - 修复响应格式判断
            async handleAvatarUpload(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                // 验证文件类型
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    alert('请选择支持的图片格式（JPG、PNG、GIF、BMP、WebP）！');
                    return;
                }
                
                // 验证文件大小 (10MB)
                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('图片大小不能超过 10MB！');
                    return;
                }
                
                this.uploadingAvatar = true;
                
                try {
                    // 创建 FormData 对象
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    console.log('开始上传文件:', file.name, '大小:', file.size, '类型:', file.type);
                    
                    // 调用后端上传接口
                    const response = await this.$axios.post('/api/common/upload', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    console.log('文件上传完整响应:', response);
                    console.log('响应状态:', response.status);
                    console.log('响应数据:', response.data);
                    
                    // 修复：后端返回的是 code: 1，不是 code: 200
                    if (response.status === 200 && response.data && response.data.code === 1) {
                        // 直接使用返回的URL字符串
                        this.newCommunity.avatarUrl = response.data.data;
                        console.log('设置头像URL:', this.newCommunity.avatarUrl);
                        alert('头像上传成功！');
                    } else {
                        console.error('上传失败，响应数据:', response.data);
                        throw new Error(response.data?.msg || response.data?.message || '服务器返回错误');
                    }
                } catch (error) {
                    console.error('头像上传失败 - 完整错误信息:', error);
                    console.error('错误响应:', error.response);
                    
                    let errorMessage = '上传失败';
                    if (error.response) {
                        console.error('HTTP错误状态:', error.response.status);
                        console.error('错误响应数据:', error.response.data);
                        errorMessage = error.response.data?.msg || error.response.data?.message || `HTTP错误: ${error.response.status}`;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    alert('上传失败：' + errorMessage);
                } finally {
                    this.uploadingAvatar = false;
                    // 清空 input 值，允许重新选择同一个文件
                    event.target.value = '';
                }
            },
            
            // 删除头像
            removeAvatar() {
                this.newCommunity.avatarUrl = '';
            },

            // 检查成员身份并进入群聊（使用成员列表接口）
            async checkMembershipAndEnter(communityId) {
                // 设置加载状态
                const community = this.allCommunities.find(c => c.id === communityId);
                if (community) {
                    this.$set(community, 'checking', true);
                }

                try {
                    console.log('🔍 检查用户是否为社群成员...', communityId);
                    
                    // 首先获取当前用户ID
                    const currentUserResponse = await this.$axios.get('/api/users/me');
                    if (currentUserResponse.data.code !== 1) {
                        alert('请先登录后再尝试进入群聊');
                        return;
                    }
                    
                    const currentUserId = currentUserResponse.data.data.userId;
                    console.log('👤 当前用户ID:', currentUserId);
                    
                    // 获取社群成员列表
                    const membersResponse = await this.$axios.get(`/api/community/members/${communityId}`);
                    
                    console.log('📋 成员列表响应:', membersResponse.data);
                    
                    if (membersResponse.data.code === 1 && Array.isArray(membersResponse.data.data)) {
                        const members = membersResponse.data.data;
                        
                        // 在成员列表中查找当前用户
                        const currentUserMember = members.find(member => member.userId === currentUserId);
                        
                        if (currentUserMember) {
                            // 用户是成员，可以进入群聊
                            console.log('✅ 用户是社群成员，角色:', currentUserMember.role);
                            this.$router.push(`/community/${communityId}`);
                        } else {
                            // 用户不是成员，显示提示
                            console.log('❌ 用户不是社群成员，无法进入群聊');
                            this.showMembershipRequiredDialog(community);
                        }
                    } else {
                        console.error('❌ 获取成员列表失败:', membersResponse.data);
                        alert('获取社群信息失败，请重试');
                    }
                } catch (error) {
                    console.error('❌ 检查成员身份异常:', error);
                    
                    if (error.response) {
                        if (error.response.status === 401) {
                            alert('请先登录后再尝试进入群聊');
                            // 可以跳转到登录页面
                            // this.$router.push('/login');
                        } else if (error.response.status === 403) {
                            alert('您没有权限访问该社群');
                        } else if (error.response.status === 404) {
                            alert('社群不存在或已被删除');
                        } else {
                            alert('网络错误，请检查网络连接后重试');
                        }
                    } else {
                        alert('网络错误，请检查网络连接后重试');
                    }
                } finally {
                    // 清除加载状态
                    if (community) {
                        this.$set(community, 'checking', false);
                    }
                }
            },

            // 显示需要成员身份的提示
            showMembershipRequiredDialog(community) {
                const shouldJoin = confirm(`您需要先加入"${community.name}"才能进入群聊。\n\n是否现在申请加入？`);
                if (shouldJoin) {
                    this.openJoinDialog(community);
                }
            },
        }
    };
</script>

<style scoped>
    .v-card {
        transition: transform 0.2s ease-in-out;
    }

    .v-card:hover {
        transform: translateY(-2px);
    }

    /* 确保卡片高度一致 */
    .v-card .v-card__title {
        min-height: 48px;
        padding-bottom: 8px;
    }

    /* 描述文本截断 */
    .text-truncate-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* 搜索高亮样式 */
    mark {
        background-color: #ffeb3b !important;
        padding: 1px 2px;
        border-radius: 2px;
    }
</style>