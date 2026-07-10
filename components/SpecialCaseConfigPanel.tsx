import { useEffect, useState } from 'react';

export type MemberPriceRelationMode = 'BASIC_BENEFIT' | 'ACTIVITY_SHARE_MUTEX';

const STORAGE_KEY = 'share-mutex-special-case-config';

export function loadSpecialCaseConfig(): MemberPriceRelationMode {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === 'BASIC_BENEFIT' || raw === 'ACTIVITY_SHARE_MUTEX') return raw;
  } catch {
    // ignore
  }
  return 'ACTIVITY_SHARE_MUTEX';
}

export function saveSpecialCaseConfig(mode: MemberPriceRelationMode): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

interface SpecialCaseConfigPanelProps {
  open: boolean;
  onClose: () => void;
  value: MemberPriceRelationMode;
  onSave: (value: MemberPriceRelationMode) => void;
}

export function SpecialCaseConfigPanel({ open, onClose, value, onSave }: SpecialCaseConfigPanelProps) {
  const [draft, setDraft] = useState<MemberPriceRelationMode>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!open) return null;

  return (
    <div className="special-case-modal" role="dialog" aria-modal="true" aria-labelledby="special-case-title">
      <div className="special-case-modal__mask" onClick={onClose} />
      <div className="special-case-modal__panel">
        <div className="special-case-modal__header">
          <h3 id="special-case-title" className="special-case-modal__title">特例配置</h3>
          <button type="button" className="special-case-modal__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="special-case-modal__body">
          <div className="special-case-form">
            <div className="special-case-form__row">
              <label className="special-case-form__label">
                会员价、付费会员价、消费特权：
              </label>
              <div className="special-case-form__options">
                <label className={`special-case-radio ${draft === 'BASIC_BENEFIT' ? 'is-checked' : ''}`}>
                  <input
                    type="radio"
                    name="memberPriceRelation"
                    value="BASIC_BENEFIT"
                    checked={draft === 'BASIC_BENEFIT'}
                    onChange={() => setDraft('BASIC_BENEFIT')}
                  />
                  <span className="special-case-radio__dot" />
                  <span className="special-case-radio__text">作为会员基础权益</span>
                </label>
                <label className={`special-case-radio ${draft === 'ACTIVITY_SHARE_MUTEX' ? 'is-checked' : ''}`}>
                  <input
                    type="radio"
                    name="memberPriceRelation"
                    value="ACTIVITY_SHARE_MUTEX"
                    checked={draft === 'ACTIVITY_SHARE_MUTEX'}
                    onChange={() => setDraft('ACTIVITY_SHARE_MUTEX')}
                  />
                  <span className="special-case-radio__dot" />
                  <span className="special-case-radio__text">作为活动参与共享互斥逻辑</span>
                </label>
              </div>
            </div>

            <div className="special-case-form__hints">
              <p>1、基础权益：可与促销、优惠券叠加；同一商品多项权益时取最优折扣。</p>
              <p>2、参与活动：按共享互斥规则判断是否可与活动、券同时使用。</p>
            </div>
          </div>
        </div>

        <div className="special-case-modal__footer">
          <button type="button" className="btn btn--default" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
