# tag-release
特定 git 操作的自动化；

## 灰度发布
合并远程 develop 分支 到本地 release 分支，并同步到远程 release 分支

## 正式发布
1. pull release
2. pull tag
3. 合并 release 到 master
4. 打 tag：自动生成 version（按日期）和 describe （按 commit message）
5. push master 和 tag
