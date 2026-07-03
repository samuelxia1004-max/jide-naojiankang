export type ChoiceTrainingKind =
  | "attentionSearch"
  | "categorySort"
  | "sequencePlan"
  | "communication"
  | "wordAssociation"
  | "numberTime"
  | "routeSpatial"
  | "medicineSafety";

export type ChoiceTrainingSet = {
  id: string;
  title: string;
  prompt: string;
  targets: [string, string, string];
  choices: string[];
  tip: string;
};

export type ChoiceTrainingModule = {
  id: ChoiceTrainingKind;
  title: string;
  shortTitle: string;
  description: string;
  instruction: string;
  sets: ChoiceTrainingSet[];
};

const contexts = [
  "早晨吃药前",
  "去社区活动室",
  "医院复诊前台",
  "超市买菜",
  "接到陌生电话",
  "晚上准备睡觉",
  "坐公交换乘",
  "整理银行账单",
  "邻居来访",
  "厨房做饭时",
  "家庭群通知",
  "小区散步",
  "节日聚餐",
  "查看体检单",
  "使用洗衣机",
  "参加健康讲座",
  "找钥匙出门",
  "旅行整理背包",
  "药盒补药",
  "缴水电费",
];

function pickUnique(pool: string[], start: number, count: number) {
  const picked: string[] = [];
  let offset = 0;
  while (picked.length < count && offset < pool.length * 2) {
    const item = pool[(start + offset) % pool.length];
    if (!picked.includes(item)) picked.push(item);
    offset += 1;
  }
  return picked;
}

function weaveChoices(targets: string[], lures: string[]) {
  return [
    targets[0],
    lures[0],
    targets[1],
    lures[1],
    lures[2],
    targets[2],
    lures[3],
    lures[4],
  ].filter((item, index, all) => all.indexOf(item) === index);
}

function buildGeneratedSets(
  moduleId: ChoiceTrainingKind,
  promptPrefix: string,
  targetPool: string[],
  lurePool: string[],
  tips: string[],
): ChoiceTrainingSet[] {
  return contexts.map((context, index) => {
    const targets = pickUnique(targetPool, index * 2, 3) as [string, string, string];
    const lures = pickUnique(lurePool, index * 5, 5);
    return {
      id: `${moduleId}-${String(index + 1).padStart(2, "0")}`,
      title: context,
      prompt: `${context}：${promptPrefix}。请选择 3 项更稳妥的做法。`,
      targets,
      choices: weaveChoices(targets, lures),
      tip: tips[index % tips.length],
    };
  });
}

const attentionTargets = [
  "先找日期、时间、地点",
  "一次只看一行信息",
  "把需要马上处理的项目圈出",
  "把已完成的项目划掉",
  "用手指或纸条遮住旁边内容",
  "把相似字慢慢比对",
  "先停一下再点选答案",
  "把重要词读出声",
  "把不确定项留到最后",
  "看完后复查一遍",
  "先分清任务和背景信息",
  "把同类信息放在一起看",
];

const attentionLures = [
  "先凭熟悉词快速选择",
  "看到相似字就先全部选上",
  "一边聊天一边完成",
  "只看颜色最显眼的字",
  "把不确定项暂时算作正确",
  "跳过日期只看大标题",
  "先问别人答案再看题",
  "一次记住所有细节",
  "越快越好不用回看",
  "只选自己喜欢的词",
  "中途换到另一件事",
  "用猜测代替核对",
];

const planTargets = [
  "先确认目标是什么",
  "把事情分成两三步",
  "先做有时间限制的事",
  "把需要带的东西放到门口",
  "完成一步就做记号",
  "留出休息和缓冲时间",
  "把复杂步骤写成清单",
  "先处理安全相关事项",
  "遇到卡住时暂停核对",
  "把重复事项固定位置",
  "请家人只提醒关键一步",
  "把下一步说出来再做",
];

const planLures = [
  "先做最顺手但不急的事",
  "等全部想清楚再开始",
  "一口气同时做几件事",
  "只靠临时记忆坚持",
  "漏一步也不回头核对",
  "把所有物品换新位置",
  "让别人直接替你做完",
  "为了赶快完成不休息",
  "把提醒纸条随手乱放",
  "从中间步骤开始尝试",
  "只记大概不用看清单",
  "卡住时继续硬想很久",
];

const communicationTargets = [
  "先承认对方感受",
  "用一起完成代替责备",
  "一次只说一件事",
  "给出两个清楚选择",
  "语速放慢并等待回应",
  "把提醒写在看得见处",
  "保留对方能做的部分",
  "用具体例子说明担心",
  "先谈安全再谈对错",
  "避开疲劳和争吵时段",
  "把问题换成下一步",
  "给照护者也安排休息",
];

const communicationLures = [
  "反复问你怎么又忘了",
  "一次讲完所有担心",
  "当众指出所有错误",
  "用命令语气催快一点",
  "直接收走所有东西",
  "只说你必须听我的",
  "在对方累时继续追问",
  "用吓唬方式让人配合",
  "把偶尔忘事当成结论",
  "让家人之间互相指责",
  "不解释就替对方决定",
  "只盯着做错的地方",
];

const numberTargets = [
  "把金额写在纸上再核对",
  "先分清日期和星期",
  "付款前再看一遍收款方",
  "把药量和次数分开读",
  "用日历确认预约时间",
  "大额付款先和家人核对",
  "把找零数和小票对照",
  "把车次和站台分开圈出",
  "先算整十再算零头",
  "把验证码告诉谁都要谨慎",
  "用闹钟提醒关键时间",
  "把账单按月份放好",
];

const numberLures = [
  "看到熟悉名字就付款",
  "只记大概金额不用看小票",
  "验证码先发给对方再说",
  "把上午下午先忽略",
  "先按最快按钮完成",
  "凭印象判断是否交过费",
  "把多个账单混在一起看",
  "不用看单位只看数字",
  "把药片颜色当作剂量",
  "不确定时先多付一点",
  "看错日期也不用改",
  "让陌生电话指导操作",
];

const routeTargets = [
  "先看当前位置标志",
  "确认回家的固定路线",
  "把入口和出口分清",
  "在熟悉地标处暂停核对",
  "随身带联系卡",
  "手机保持有电",
  "出门前说明预计回家时间",
  "遇到绕路先停下询问工作人员",
  "把换乘站写下来",
  "选择光线好人流稳定的路线",
  "避免临时改去陌生地点",
  "把目的地名称读出来确认",
];

const routeLures = [
  "看到人多就跟着走",
  "临时走没去过的小路",
  "手机没电也继续远走",
  "把左右方向先猜一个",
  "不看站名只看车颜色",
  "为了省时间跳过核对",
  "迷路时继续往前试",
  "把联系卡放在家里",
  "坐错车也不告诉别人",
  "在人少昏暗处等很久",
  "只凭很多年前的印象",
  "临时取消回家时间约定",
];

const medicineTargets = [
  "用分格药盒",
  "服药后做一个记号",
  "新药先问医生或药师",
  "把早晚药分开放",
  "保留药盒和说明",
  "按医嘱时间服用",
  "漏服时先咨询再处理",
  "请家人核对复杂药表",
  "把过期药单独清出",
  "复诊时带上用药清单",
  "不要自行加减剂量",
  "药物变化当天写下来",
];

const medicineLures = [
  "想不起来就再吃一次",
  "凭药片颜色判断用法",
  "把所有药倒进一个瓶",
  "别人有效的药也试试",
  "不舒服就自行停药",
  "说明书太长就不看",
  "漏服后一次补双倍",
  "把保健品当成药替代",
  "药盒空了也不记录",
  "复诊时只说大概吃过",
  "把早晚药混在桌上",
  "家人提醒时先争输赢",
];

const semanticSets: ChoiceTrainingSet[] = [
  ["厨房用具", "请从选项中找出 3 个更像厨房用具的词。", ["汤勺", "砧板", "饭碗"], ["钥匙", "雨伞", "围巾", "车票", "相册"]],
  ["出门随身物", "请找出 3 个出门前更常需要检查的物品。", ["钥匙", "手机", "公交卡"], ["台灯", "花盆", "枕头", "遥控器", "菜刀"]],
  ["复诊资料", "请找出 3 个去医院复诊更常要带的资料。", ["病历", "药单", "检查报告"], ["围裙", "拖鞋", "茶叶", "剪刀", "相框"]],
  ["买菜清单", "请找出 3 个更像买菜清单里的食物。", ["白菜", "豆腐", "苹果"], ["螺丝", "邮票", "毛巾", "台灯", "钥匙"]],
  ["节日准备", "请找出 3 个更像节日准备用品的词。", ["灯笼", "糖果", "红包"], ["药盒", "雨鞋", "存折", "电池", "牙刷"]],
  ["洗漱用品", "请找出 3 个更像洗漱用品的词。", ["牙刷", "毛巾", "香皂"], ["车票", "白菜", "门卡", "筷子", "邮票"]],
  ["阅读用品", "请找出 3 个更适合阅读时使用的物品。", ["眼镜", "台灯", "书签"], ["锅盖", "雨伞", "米袋", "药瓶", "拖鞋"]],
  ["修理工具", "请找出 3 个更像修理工具的词。", ["螺丝刀", "胶带", "钳子"], ["茶杯", "围巾", "苹果", "公交卡", "报纸"]],
  ["阳台物品", "请找出 3 个更常出现在阳台的物品。", ["花盆", "水壶", "夹子"], ["病历", "车票", "汤勺", "闹钟", "存折"]],
  ["卧室物品", "请找出 3 个更常放在卧室的物品。", ["枕头", "被子", "睡衣"], ["白菜", "锅铲", "站台", "药单", "胶带"]],
  ["公交信息", "请找出 3 个更像公交出行信息的词。", ["站名", "线路", "换乘"], ["汤勺", "相册", "红包", "枕头", "剪刀"]],
  ["银行事务", "请找出 3 个更像银行事务相关的词。", ["存折", "账单", "银行卡"], ["花盆", "饭碗", "围巾", "牙刷", "公交站"]],
  ["药物管理", "请找出 3 个更像用药管理相关的词。", ["药盒", "剂量", "服药时间"], ["相框", "雨伞", "白菜", "台灯", "红包"]],
  ["天气出门", "请找出 3 个和雨天出门更相关的物品。", ["雨伞", "雨鞋", "防滑鞋"], ["存折", "砧板", "书签", "药单", "灯笼"]],
  ["家庭安全", "请找出 3 个更像家庭安全提醒的词。", ["关火", "防滑", "锁门"], ["糖果", "相册", "豆腐", "站台", "夹子"]],
  ["睡前流程", "请找出 3 个更像睡前会检查的事。", ["关灯", "锁门", "放好眼镜"], ["买白菜", "换乘站", "取报告", "贴邮票", "修水龙头"]],
  ["社区活动", "请找出 3 个更像社区活动相关的词。", ["活动室", "签到", "讲座"], ["药量", "锅盖", "睡衣", "红包", "螺丝刀"]],
  ["电话留言", "请找出 3 个更适合记录电话留言的内容。", ["来电人", "回电时间", "要办的事"], ["菜价", "锅铲", "鞋码", "窗帘", "药片颜色"]],
  ["旅行准备", "请找出 3 个更像旅行前准备的词。", ["证件", "车票", "目的地"], ["汤勺", "枕头", "花盆", "台灯", "药盒"]],
  ["缴费信息", "请找出 3 个更像缴费时要核对的信息。", ["户号", "金额", "截止日期"], ["菜名", "围巾", "站台", "书签", "水壶"]],
].map(([title, prompt, targets, lures], index) => ({
  id: `categorySort-${String(index + 1).padStart(2, "0")}`,
  title: title as string,
  prompt: prompt as string,
  targets: targets as [string, string, string],
  choices: weaveChoices(targets as string[], lures as string[]),
  tip: "分类练习重点是慢慢找共同点，不需要追求速度。",
}));

const associationSets: ChoiceTrainingSet[] = [
  ["茶杯", "看到“茶杯”，请选择 3 个更容易一起想到的词。", ["热水", "茶叶", "杯盖"], ["车票", "钥匙", "药盒", "雨鞋", "站台"]],
  ["医院", "看到“医院”，请选择 3 个更容易一起想到的词。", ["挂号", "医生", "病历"], ["锅铲", "花盆", "公交卡", "围巾", "糖果"]],
  ["厨房", "看到“厨房”，请选择 3 个更容易一起想到的词。", ["锅", "菜板", "关火"], ["站名", "药单", "书签", "雨伞", "存折"]],
  ["出门", "看到“出门”，请选择 3 个更容易一起想到的词。", ["钥匙", "手机", "锁门"], ["枕头", "汤勺", "相册", "米袋", "牙膏"]],
  ["账单", "看到“账单”，请选择 3 个更容易一起想到的词。", ["金额", "日期", "缴费"], ["白菜", "毛巾", "灯笼", "闹钟", "花盆"]],
  ["公交", "看到“公交”，请选择 3 个更容易一起想到的词。", ["站台", "线路", "换乘"], ["药盒", "砧板", "红包", "枕头", "相框"]],
  ["药盒", "看到“药盒”，请选择 3 个更容易一起想到的词。", ["早晚", "剂量", "服药"], ["车票", "花盆", "雨伞", "书签", "白菜"]],
  ["雨天", "看到“雨天”，请选择 3 个更容易一起想到的词。", ["雨伞", "防滑", "慢走"], ["存折", "锅盖", "药单", "糖果", "相册"]],
  ["电话", "看到“电话”，请选择 3 个更容易一起想到的词。", ["留言", "回拨", "号码"], ["米袋", "拖鞋", "砧板", "车站", "台灯"]],
  ["睡觉", "看到“睡觉”，请选择 3 个更容易一起想到的词。", ["关灯", "枕头", "安静"], ["挂号", "白菜", "钥匙孔", "公交线", "红包"]],
  ["节日", "看到“节日”，请选择 3 个更容易一起想到的词。", ["聚餐", "礼物", "祝福"], ["药量", "站台", "账单", "螺丝", "病历"]],
  ["散步", "看到“散步”，请选择 3 个更容易一起想到的词。", ["路线", "防滑", "联系卡"], ["汤勺", "台灯", "剂量", "红包", "砧板"]],
  ["阅读", "看到“阅读”，请选择 3 个更容易一起想到的词。", ["眼镜", "台灯", "报纸"], ["锅铲", "钥匙", "药盒", "雨鞋", "车票"]],
  ["洗衣", "看到“洗衣”，请选择 3 个更容易一起想到的词。", ["衣物", "洗衣液", "晾晒"], ["存折", "病历", "公交卡", "茶叶", "红包"]],
  ["复诊", "看到“复诊”，请选择 3 个更容易一起想到的词。", ["预约", "检查单", "药单"], ["汤勺", "花盆", "睡衣", "站台", "糖果"]],
  ["买菜", "看到“买菜”，请选择 3 个更容易一起想到的词。", ["清单", "付款", "找零"], ["药盒", "枕头", "书签", "公交线", "门锁"]],
  ["钥匙", "看到“钥匙”，请选择 3 个更容易一起想到的词。", ["门", "锁", "固定位置"], ["病历", "白菜", "站台", "药量", "茶叶"]],
  ["水电费", "看到“水电费”，请选择 3 个更容易一起想到的词。", ["户号", "金额", "截止日"], ["锅盖", "枕头", "车票", "药盒", "围巾"]],
  ["社区", "看到“社区”，请选择 3 个更容易一起想到的词。", ["活动室", "邻居", "通知"], ["账单", "锅铲", "剂量", "雨鞋", "书签"]],
  ["旅行", "看到“旅行”，请选择 3 个更容易一起想到的词。", ["证件", "车票", "路线"], ["汤勺", "药量", "花盆", "相框", "白菜"]],
].map(([title, prompt, targets, lures], index) => ({
  id: `wordAssociation-${String(index + 1).padStart(2, "0")}`,
  title: title as string,
  prompt: prompt as string,
  targets: targets as [string, string, string],
  choices: weaveChoices(targets as string[], lures as string[]),
  tip: "联想练习可以帮助整理词义关系，答错也只是练习材料。",
}));

export const choiceTrainingModules: ChoiceTrainingModule[] = [
  {
    id: "attentionSearch",
    title: "注意搜索",
    shortTitle: "注意",
    description: "在相似信息里慢慢找关键点。",
    instruction: "先看清题干，再从相似选项中挑出更稳妥的 3 项。",
    sets: buildGeneratedSets("attentionSearch", "练习从相似信息中找关键项", attentionTargets, attentionLures, [
      "注意练习不比速度，先稳再快。",
      "用手指辅助阅读，能减少漏看和串行。",
    ]),
  },
  {
    id: "categorySort",
    title: "分类归纳",
    shortTitle: "分类",
    description: "按共同点挑出同类词。",
    instruction: "请找出和题干最同类的 3 个词，干扰项会有一点像。",
    sets: semanticSets,
  },
  {
    id: "sequencePlan",
    title: "步骤计划",
    shortTitle: "步骤",
    description: "把日常任务拆成更稳的步骤。",
    instruction: "请选出 3 个更适合放进清单的步骤。",
    sets: buildGeneratedSets("sequencePlan", "练习把事情拆小、排清楚", planTargets, planLures, [
      "复杂任务先拆小，能减少临时紧张。",
      "清单是支持工具，不是丢脸。",
    ]),
  },
  {
    id: "communication",
    title: "情景判断",
    shortTitle: "情景",
    description: "练习更温和、更有支持性的回应。",
    instruction: "请选出 3 个更能减少压力、保护尊严的做法。",
    sets: buildGeneratedSets("communication", "练习选择更低压力的沟通方式", communicationTargets, communicationLures, [
      "先保住面子，再解决事情，沟通会顺很多。",
      "照护者也需要休息，支持不是一个人硬扛。",
    ]),
  },
  {
    id: "wordAssociation",
    title: "语言联想",
    shortTitle: "联想",
    description: "按词义关系找更贴近的词。",
    instruction: "请从相似选项里找出和提示词关系更近的 3 项。",
    sets: associationSets,
  },
  {
    id: "numberTime",
    title: "数字时间",
    shortTitle: "数字",
    description: "练习核对金额、日期、时间和数量。",
    instruction: "请选出 3 个更能减少看错、算错或被骗的做法。",
    sets: buildGeneratedSets("numberTime", "练习核对数字、金额和时间", numberTargets, numberLures, [
      "数字题的关键是核对，不是心算速度。",
      "涉及验证码和付款时，慢一点就是保护。",
    ]),
  },
  {
    id: "routeSpatial",
    title: "路线方位",
    shortTitle: "路线",
    description: "练习出门路线和方位支持。",
    instruction: "请选出 3 个更能帮助安全出行的做法。",
    sets: buildGeneratedSets("routeSpatial", "练习用地标、路线和联系线索帮助出行", routeTargets, routeLures, [
      "路线练习的重点是提前留线索，不是考方向感。",
      "固定路线、联系卡和充足电量都是实际支持。",
    ]),
  },
  {
    id: "medicineSafety",
    title: "用药安全",
    shortTitle: "用药",
    description: "练习更稳妥的用药记录和核对。",
    instruction: "请选出 3 个更稳妥的用药支持做法。",
    sets: buildGeneratedSets("medicineSafety", "练习把用药安排做得更清楚", medicineTargets, medicineLures, [
      "用药问题要和医生或药师确认，软件只做生活记录练习。",
      "分格药盒和服药记号，能减少重复和漏服。",
    ]),
  },
];

export const choiceTrainingSetCount = choiceTrainingModules.reduce((sum, module) => sum + module.sets.length, 0);
