import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from './router'; 

import "@/extension/index"
import 'katex/dist/katex.min.css'
import "@/assets/style/global.scss"
import "@/assets/style/fonts.scss"
import "@/assets/style/tailwindcss.scss"

import Icon from "@/plugins/icon"
import Component from "@/plugins/component"
import Directive from "@/plugins/directive"

import "virtual:svg-icons-register"

const app = createApp(App);
app.use(router);
app.use(createPinia());
app.use(Icon);
app.use(Component);
app.use(Directive);
app.mount("#app");
