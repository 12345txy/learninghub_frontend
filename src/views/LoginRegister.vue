<template>
    <v-app id="auth">
        <v-main class="bg align-center">
            <v-card class=" mx-auto my-auto d-flex flex-row flex-wrap" max-width="800px" elevation="8"
                style="background:none">
                <!-- Img -->
                <v-card class="d-flex flex-column justify-center rounded-0" width="440px" elevation="0"
                    style="background-color:#F5F5F5">
                    <span class="text-h5 black--text font-weight-black" style="position:absolute;top:30px;left:30px;">
                        <v-icon medium color="black" class="mr-2 mb-1" large>mdi-school
                        </v-icon>
                        Learning Hub
                    </span>
                    <v-btn rounded style="position:absolute;top:36px;right:15px;" class="px-0" text x-small depressed
                        onclick="window.open('https://github.com/12345txy/Campus_share_Frontend.git')"> <v-icon medium
                            color="black">
                            mdi-github
                        </v-icon>
                    </v-btn>

                    <v-img class="mx-auto mt-12" src="../assets/2.jpg" max-height="380px" max-width="400px">
                    </v-img>
                </v-card>

                <!-- Input -->
                <v-card class="pa-6 ml-auto rounded-0" width="360px" height="480px" elevation="0">
                    <v-card-title class="text-center justify-center py-6">
                        <h2 class="font-weight-bold text-h4 basil--text">
                            Welcome !
                        </h2>
                    </v-card-title>
                    <v-tabs background-color="transparent" color="black" centered>
                        <v-tab :key="0">Log in</v-tab>
                        <v-tab :key="1">Sign up</v-tab>
                        <v-tab-item :key="0">
                            <v-container class="px-12 pt-6">
                                <v-text-field label="Username/Email/Phone" v-model="identifier"
                                    append-icon="mdi-account-box-edit-outline" clearable>
                                </v-text-field>
                                <v-text-field class="mb-4" label="Password" :type="showPassword ? 'text' : 'password'"
                                    v-model="passwordOrCode" :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append="showPassword = !showPassword" clearable>
                                </v-text-field>
                                <v-btn class="white--text font-weight-bold" :loading="loading" :disabled="loading"
                                    color="blue accent-2" outlined rounded @click="login();loader = 'loading'">
                                    Log in
                                </v-btn>
                            </v-container>
                        </v-tab-item>

                        <v-tab-item :key="1">
                            <v-container class="px-12 pt-2">
                                <v-text-field label="Username" v-model="registerUsername" clearable>
                                </v-text-field>
                                <v-text-field label="Password" v-model="registerPassword" clearable>
                                </v-text-field>
                                <v-text-field label="Nickname (Optional)" v-model="nickname" clearable>
                                </v-text-field>
                                <v-text-field label="Email" v-model="email" append-icon="mdi-email-check-outline"
                                    :rules="[rules.email]" clearable>
                                </v-text-field>
                                <v-text-field label="Phone Number" v-model="phone" append-icon="mdi-phone"
                                    :rules="[rules.phone]" clearable>
                                </v-text-field>
                                <v-btn class="mt-2 white--text font-weight-bold" :loading="loading" :disabled="loading"
                                    color="blue accent-2" outlined rounded @click="signup();loader = 'loading'">
                                    Sign up
                                </v-btn>
                            </v-container>
                        </v-tab-item>
                    </v-tabs>
                </v-card>
            </v-card>

        </v-main>
    </v-app>
</template>

<script>
    export default {
        name: 'LoginRegister',
        data: () => ({
            //登录
            identifier: '',
            passwordOrCode: '',
            //注册
            registerUsername: '',
            registerPassword: '',
            nickname: '',
            email: '',
            phone: '',
            
            loading: false,
            loader: null,
            showPassword: false,
            rules: {
                email: value => {
                    if (!value) return true; // allow empty
                    const pattern = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
                    return pattern.test(value) || 'Invalid email format.';
                },
                phone: value => {
                    if (!value) return true; // allow empty
                    const pattern = /^1[3456789]\d{9}$/;
                    return pattern.test(value) || 'Invalid phone number format.';
                }
            }
        }),
        watch: {
            loader() {
                const l = this.loader
                this[l] = !this[l]
                setTimeout(() => (this[l] = false), 2000)
                this.loader = null
            },
        },
        methods: {

            login: function () {
                const self = this;
                
                const requestData = {
                    identifier: this.identifier,
                    passwordOrCode: this.passwordOrCode,
                    pattern: 1, // 1 for password login
                };
                
                this.$axios({
                    method: 'post',
                    url: '/api/users/login',
                    data: requestData,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }).then(res => {
                    console.log('登录响应:', res.data);
                    if (res.data.code === 1) { // Success code is 1
                        // IMPORTANT: Per new API, only token is returned.
                        // User info should be fetched on the next page using this token.
                        localStorage.setItem('token', res.data.data);
                        
                        // For simplicity, just redirect to a general front page.
                        // The logic for admin redirect should be handled elsewhere,
                        // for example, in a global router guard after fetching user info.
                        this.$router.push('/Frontpage').catch(() => {});

                    } else {
                        window.alert(res.data.message || '登录失败，请检查您的凭据。');
                    }
                }).catch(error => {
                    console.log(error);
                    window.alert('发生错误，请稍后重试。');
                    self.loading = false;
                });
            },
            signup: function () {
                const self = this;
                if (!this.registerUsername || !this.registerPassword) {
                    window.alert('用户名和密码不能为空');
                    return;
                }
                
                // Construct request data, only including fields that have values.
                const requestData = {
                    username: this.registerUsername,
                    password: this.registerPassword,
                };
                if (this.nickname) requestData.nickname = this.nickname;
                if (this.email) requestData.email = this.email;
                if (this.phone) requestData.phone = this.phone;


                this.$axios({
                    method: 'post',
                    url: '/api/users/register',
                    data: requestData,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }).then(res => {
                    console.log(res.data);
                    if (res.data.code === 1) { // Success code is 1
                        window.alert('注册成功, 请登录！');
                    } else {
                        window.alert(res.data.message || '注册失败，请重试。');
                    }
                }).catch(error => {
                    console.log(error);
                    window.alert('发生错误，请稍后重试。');
                    self.loading = false;
                });
            },
        },
    };
</script>
<style>
    #auth {
        /* background-image:linear-gradient(#4285f4, #d2d5fc);*/
        background-image: url(../assets/bg2.jpg);
        background-size: cover;
        background-position: center center;
    }

    .bg {
        background-color: rgba(0, 0, 0, 0.1);
        /* backdrop-filter:blur(100px); */
    }

    .custom-loader {
        animation: loader 1s infinite;
        display: flex;
    }

    @-moz-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-webkit-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @-o-keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @keyframes loader {
        from {
            transform: rotate(0);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>