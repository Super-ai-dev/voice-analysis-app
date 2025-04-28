#!/bin/bash

# ESLintとTypeScriptのチェックを無効化
export NEXT_IGNORE_ESLINT=1
export NEXT_IGNORE_TYPESCRIPT_ERRORS=1

# ビルドを実行
next build
