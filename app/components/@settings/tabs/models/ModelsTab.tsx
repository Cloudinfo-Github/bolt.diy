/**
 * 模型管理 Tab - 用於管理自定義模型配置
 */

import { ModelManagement } from '~/components/@settings/providers/ModelManagement';

export function ModelsTab() {
  return (
    <div className="h-full">
      <ModelManagement />
    </div>
  );
}
