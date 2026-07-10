export interface ShareMutexRule {
  id: string;
  name: string;
  relationType: '组内关系' | '组间关系';
  ruleObjectCount: number;
  limitType: '共享' | '互斥';
  targetCount: number;
  status: '已启用' | '已停用';
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
}

export const MOCK_SHARE_MUTEX_RULES: ShareMutexRule[] = [
  {
    id: '202506290001',
    name: '测试',
    relationType: '组内关系',
    ruleObjectCount: 0,
    limitType: '共享',
    targetCount: 0,
    status: '已启用',
    updatedBy: 'YYJ / 10001',
    updatedAt: '2025-06-28 18:32:15',
    createdAt: '2025-06-20 10:15:00',
  },
  {
    id: '202506280002',
    name: '666',
    relationType: '组间关系',
    ruleObjectCount: 1,
    limitType: '互斥',
    targetCount: 1,
    status: '已启用',
    updatedBy: 'YYJ / 10001',
    updatedAt: '2025-06-27 14:20:08',
    createdAt: '2025-06-15 09:30:22',
  },
  {
    id: '202506250003',
    name: 'pos共享',
    relationType: '组内关系',
    ruleObjectCount: 3,
    limitType: '共享',
    targetCount: 3,
    status: '已启用',
    updatedBy: '张三 / 10002',
    updatedAt: '2025-06-25 11:45:33',
    createdAt: '2025-06-10 16:08:45',
  },
  {
    id: '202506220004',
    name: '满减与券互斥',
    relationType: '组间关系',
    ruleObjectCount: 4,
    limitType: '互斥',
    targetCount: 4,
    status: '已启用',
    updatedBy: '李四 / 10003',
    updatedAt: '2025-06-22 09:12:56',
    createdAt: '2025-06-01 08:00:00',
  },
  {
    id: '202506180005',
    name: '会员权益共享',
    relationType: '组内关系',
    ruleObjectCount: 2,
    limitType: '共享',
    targetCount: 2,
    status: '已启用',
    updatedBy: 'YYJ / 10001',
    updatedAt: '2025-06-18 17:30:00',
    createdAt: '2025-05-28 14:22:18',
  },
  {
    id: '202506120006',
    name: '平台券互斥规则',
    relationType: '组间关系',
    ruleObjectCount: 1,
    limitType: '互斥',
    targetCount: 1,
    status: '已启用',
    updatedBy: '王五 / 10004',
    updatedAt: '2025-06-12 13:05:42',
    createdAt: '2025-05-20 11:30:00',
  },
  {
    id: '202506080007',
    name: '早餐次卡共享',
    relationType: '组内关系',
    ruleObjectCount: 0,
    limitType: '共享',
    targetCount: 0,
    status: '已启用',
    updatedBy: 'YYJ / 10001',
    updatedAt: '2025-06-08 10:18:27',
    createdAt: '2025-05-15 09:45:33',
  },
];
