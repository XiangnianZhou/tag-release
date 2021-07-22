import * as vscode from 'vscode'
import { DataList } from './dataProvider'
import * as cp from 'child_process'

export async function getPordData(customVersion?: string | undefined, customDesc?: string | undefined): Promise<DataList> {
  // 生成默认版本号
  const now = new Date
  const year = now.getFullYear().toString().slice(2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const date = now.getDate().toString().padStart(2, '0')

  const version = customVersion || `v${year}${month}${date}`
  // 同步
  await gitCommand('git fetch origin release:release')
  console.log('正在同步release')

  // 判断是否有新提交
  let { stdout: gitDescribe } = await gitCommand('git describe origin/release')
  const hasNewCommit = gitDescribe.length > 10
  if (!hasNewCommit) {
    return new DataList([])
  }

  // 查看最新的Tag
  let { stdout: lastTag } = await gitCommand('git describe origin/master --tags --abbrev=0')
  lastTag = lastTag.trim()
  // const tagRepeat = version === lastTag // 是否和最新的标记重名
  const repeatReg = new RegExp(`${version}(-(\\d+))?`)
  const repeatMatch = lastTag.match(repeatReg)
  const isTagRepeat = !!repeatMatch
  const subVersion = repeatMatch && repeatMatch[2] ? `-${repeatMatch[2] + 1}` : ''

  // 对于重复的tag，要找到上上个tag
  // if (isTagRepeat) {
  //   const { stdout: tags } = await gitCommand('git tag -l --sort=-v:refname')
  //   lastTag = tags.split(/\r?\n/)[1]
  // }

  // 获取commit msg 信息
  const commitMsgData = await gitCommand(`git log --pretty="%s" ${lastTag}..origin/release`)
  let tagDescribe: string
  if (customDesc) {
    tagDescribe = customDesc
  } else if (commitMsgData.stderr) {
    tagDescribe = '没有新增和修复'
  } else {
    tagDescribe = commitMsgData.stdout
      .split(/\r?\n/)
      .filter(i => /^(feat|fix)[:：]/.test(i))
      .map(i => i.replace(/^feat[:：]/, '【新增】').replace(/^fix[:：]/, '【修复】'))
      .join('；')
  }

  const dataListPro = new DataList([
    {
      label: version + subVersion,
      id: 'tag',
      description: isTagRepeat ? '已递增' : ''
    },
    {
      label: tagDescribe,
      id: 'describe'
    }
  ])
  return dataListPro
}

// 同步 release 分支
export async function tagRelease(tag: string, describe: string) {
  try {
    await gitCommand('git fetch origin release:master')
    await gitCommand('git push origin master:master')
  } catch (e) {
    vscode.window.showErrorMessage('无法拉取远程数据，请手动操作')
    return
  }

  try {
    // 打tag
    await gitCommand(`git tag ${tag} master -f -m "${describe}"`)
    await gitCommand('git push --tag -f')
    vscode.window.showInformationMessage('发布成功')
  } catch (e) {
    vscode.window.showErrorMessage('打Tag失败，请手动操作')
  }
}

// 合并 develop 代码到 release
export async function mergeDevIntoRelease() {
  console.log('正在合并 develop 代码到 release')
  await gitCommand('git fetch origin develop:release')
  await gitCommand('git push origin release:release')
}

function gitCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    cp.exec(command, { cwd: vscode.workspace.rootPath || '' }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr })
      }
      resolve({ stdout, stderr })
    })
  })
}