import * as vscode from 'vscode'
import * as path from 'path'
import { getPordData } from './git'


export class DataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  protected _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

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
    this.tag = dataProd.treeList[0]?.label?.toString()
    this.describe = dataProd.treeList[1]?.label?.toString()
  }

  async refresh() {
    this.dataList = await getPordData(this.tag, this.describe)
    this._onDidChangeTreeData.fire()
  }

  edit(offset: vscode.TreeItem): void {
    vscode.window.showInputBox({
      value: offset.label?.toString(),
      placeHolder: '请输入'
    }).then(value => {
      if (offset.id === 'tag') {
        this.tag = value ?? this.tag
      }

      if (offset.id === 'describe') {
        this.describe = value ?? this.describe
      }
      this.refresh()
    })
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
