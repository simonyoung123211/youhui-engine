import { GoogleGenAI } from "@google/genai";
import { PromotionCategory, RuleMatrix } from "../types";
import { MOCK_AI_AUDIT_REPORT } from "../data/mockAiAudit";

const getClient = () => {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeRules = async (categories: PromotionCategory[], matrix: RuleMatrix) => {
    try {
        const ai = getClient();
        if (!ai) {
            await new Promise(r => setTimeout(r, 1200));
            return MOCK_AI_AUDIT_REPORT;
        }
        const model = 'gemini-3-flash-preview';
        
        // Simplify category data for AI to save tokens
        const simplifiedCats = categories.map(c => `${c.name}(${c.group})`).join(', ');

        const context = `
        你是一位餐饮SaaS促销逻辑专家。请审计当前的促销兼容性矩阵（全局类型规则）。
        
        促销类型列表: ${simplifiedCats}
        矩阵数据 (InteractionType): ${JSON.stringify(matrix)}
        
        图例:
        - ALLOW: 完全叠加 (同单同享，且可叠加在同一商品上)
        - ITEM_MUTEX: 共享不叠加 (同单同享，但不可叠加在同一商品上)
        - MUTEX: 全局互斥 (不可出现在同一订单中)
        
        请重点关注:
        1. **单品叠加风险**: 检查 ALLOW 的单品级优惠（如会员价+折扣券）。这可能导致负毛利。
        2. **逻辑一致性**: 检查是否存在非传递性的互斥。
        3. **配置建议**: 针对"会员权益"组，通常建议如何配置 ITEM_MUTEX 以保护利润？
        
        请用简体中文，Markdown格式，列出3点关键发现。
        `;

        const response = await ai.models.generateContent({
            model,
            contents: context,
            config: {
                thinkingConfig: { thinkingBudget: 1024 }
            }
        });

        return response.text || MOCK_AI_AUDIT_REPORT;
    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        await new Promise(r => setTimeout(r, 800));
        return MOCK_AI_AUDIT_REPORT;
    }
};

export const suggestOptimization = async (currentScenario: string) => {
    // ... (existing code, keeping it simple for now)
    return "Suggestion feature coming soon.";
};