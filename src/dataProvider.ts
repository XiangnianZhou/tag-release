import * as vscode from 'vscode'
import * as path from 'path'
import { getPordData, tagRelease } from './git'


export class DataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  protected _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event

  constructor(
    public dataList: DataList
  ) { }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] | null | undefined {
    if (element) {
      return null
    }
    return this.dataList.treeList
  }
}

export class ProdDataProvider extends DataProvider {
  public tag: string | undefined
  public describe: string | undefined

  constructor(dataProd: DataList) {
    super(dataProd)
    this.update()
  }

  async refresh(tag?: string, describe?: string) {
    this.dataList = await getPordData(tag, describe)
    this.update()
    this._onDidChangeTreeData.fire()
  }

  update() {
    const data = this.dataList
    this.tag = data.treeList[0]?.label?.toString()
    this.describe = data.treeList[1]?.label?.toString()
  }

  edit(offset: vscode.TreeItem): void {
    vscode.window.showInputBox({
      value: offset.label?.toString(),
      placeHolder: '请输入'
    }).then(value => {
      let tag = this.tag
      let describe = this.describe
      if (offset.id === 'tag') {
        tag = value ?? this.tag
      }
      if (offset.id === 'describe') {
        describe = value ?? this.describe
      }

      if (this.describe !== describe || this.tag !== tag) {
        this.refresh(tag, describe)
      }
    })
  }

  async release() {
    if (this.tag && this.describe) {
      await tagRelease(this.tag, this.describe)
      this.refresh()
    } else {
      vscode.window.showErrorMessage('无法提交：缺少信息或无可提交内容')
    }
  }
}


export class DataList {
  public treeList: vscode.TreeItem[] = []
  constructor(initList: Array<vscode.TreeItem | string>) {
    this.treeList = initList.map(item => {
      if (typeof item === 'string') {
        return {
          label: item,
          iconPath: {
            light: path.resolve(__dirname, '..', 'resource/logo.svg'),
            dark: path.resolve(__dirname, '..', 'resource/logo.svg'),
          }
        }
      }
      return {
        ...item,
        iconPath: {
          light: path.resolve(__dirname, '..', 'resource/logo.svg'),
          dark: path.resolve(__dirname, '..', 'resource/logo.svg'),
        }
      }
    })
  }
}
