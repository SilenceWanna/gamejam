// 场景数据表：整个游戏由这张表驱动。新增剧情 = 在这里加一个条目。
export const SCENES = {
  title: {
    kind: 'title',
    title: 'Sandbox',
    startLabel: '开始',
    next: 'scene_1',
  },

  scene_1: {
    kind: 'narrative',
    name: '场景 1',
    text: '这是一个用于测试平台功能的项目。',

    // —— 可继续扩展的位置 ——
    // 给 choices 添加条目即可接上后续剧情，引擎会自动把每条渲染成按钮，例如：
    //   choices: [{ label: '继续', next: 'scene_2' }]
    // 然后在本表里补一个 scene_2 条目即可。
    // 保持空数组则停在此场景，不会自动生成任何后续内容。
    choices: [
      { label: '调查桌面', next: 'scene_investigate' },
      { label: '离开房间', next: 'scene_leave' },
    ],
  },

  scene_investigate: {
    kind: 'narrative',
    name: '调查桌面',
    text: '桌面上放着一张没有署名的纸条。',

    // 可继续扩展的位置：需要时给 choices 添加条目即可接上后续剧情。
    choices: [],
  },

  scene_leave: {
    kind: 'narrative',
    name: '离开房间',
    text: '你离开了这个房间。',

    // 可继续扩展的位置：需要时给 choices 添加条目即可接上后续剧情。
    choices: [],
  },
};
