import { sync } from 'glob';
import * as vscode from 'vscode';
import { DataProvider, DataList, ProdDataProvider } from './dataProvider'
import { getPordData, mergeDevIntoRelease, tagRelease } from './git'

export async function activate(context: vscode.ExtensionContext) {
  // 灰度发布
  const dataList = new DataList(['合并远程develop到release'])
  const grayProvider = new DataProvider(dataList)
  vscode.window.registerTreeDataProvider('release_pre_pord', grayProvider)

  // 正式发布
  const dataProd = await getPordData()
  const prodProvider = new ProdDataProvider(dataProd)
  vscode.window.registerTreeDataProvider('release_pord', prodProvider)

  // 注册命令
  vscode.commands.registerCommand('release_pre_pord.release', () => {
    mergeDevIntoRelease().then(() => {
      prodProvider.refresh()
      vscode.window.showInformationMessage('代码合并成功')
    })
  })

  vscode.commands.registerCommand('release_pord.release', () => {
    tagRelease(prodProvider.tag || '', prodProvider.describe || '').then(() => {
      prodProvider.refresh()
    })
  })
  vscode.commands.registerCommand('release_pord.refresh', () => prodProvider.refresh())
  vscode.commands.registerCommand('release_pord.edit', offset => prodProvider.edit(offset))
}

// this method is called when your extension is deactivated
export function deactivate() { }
