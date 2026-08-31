module.exports = {
  extends: [
    "./base.js",
    "plugin:vue/vue3-recommended",
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  rules: {
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "warn",
  },
};
