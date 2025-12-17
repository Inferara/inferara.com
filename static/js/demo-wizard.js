// Protocol Risk Self-Check Wizard
(function() {
  'use strict';

  const container = document.getElementById('demo-wizard-container');
  if (!container) return;

  const lang = document.documentElement.lang || 'en';
  const isJP = lang.includes('ja') || lang.includes('jp');

  const t = {
    en: {
      start: 'Start Assessment',
      next: 'Next',
      prev: 'Previous',
      finish: 'Generate Risk Summary',
      download: 'Download Summary',
      restart: 'Start New Assessment',
      progress: 'Step',
      of: 'of'
    },
    jp: {
      start: '評価を開始',
      next: '次へ',
      prev: '前へ',
      finish: 'リスクサマリーを生成',
      download: 'サマリーをダウンロード',
      restart: '新規評価を開始',
      progress: 'ステップ',
      of: '/'
    }
  };

  const i18n = isJP ? t.jp : t.en;

  const questions = isJP ? [
    {
      id: 'protocol_type',
      question: 'プロトコルタイプは何ですか？',
      type: 'select',
      options: [
        { value: 'amm', label: 'AMM / DEX' },
        { value: 'lending', label: 'レンディング / ボローイング' },
        { value: 'bridge', label: 'クロスチェーンブリッジ' },
        { value: 'l2', label: 'L2 / ロールアップ' },
        { value: 'governance', label: 'ガバナンス / DAO' },
        { value: 'other', label: 'その他' }
      ]
    },
    {
      id: 'stage',
      question: '現在の開発段階は？',
      type: 'select',
      options: [
        { value: 'design', label: '設計段階（コードなし）' },
        { value: 'prototype', label: 'プロトタイプ' },
        { value: 'testnet', label: 'テストネット' },
        { value: 'mainnet', label: 'メインネット稼働中' }
      ]
    },
    {
      id: 'value_at_risk',
      question: '予想されるTVL（ロック総額）は？',
      type: 'select',
      options: [
        { value: 'low', label: '$1M未満' },
        { value: 'medium', label: '$1M - $50M' },
        { value: 'high', label: '$50M - $500M' },
        { value: 'very_high', label: '$500M以上' }
      ]
    },
    {
      id: 'concerns',
      question: '最も懸念している領域は？（複数選択可）',
      type: 'checkbox',
      options: [
        { value: 'economic', label: '経済的インセンティブと手数料' },
        { value: 'oracle', label: 'オラクルとデータフィード' },
        { value: 'governance', label: 'ガバナンスと権限' },
        { value: 'mev', label: 'MEVと順序付け' },
        { value: 'edge_cases', label: 'エッジケースと境界条件' },
        { value: 'composability', label: '他のプロトコルとの相互作用' }
      ]
    },
    {
      id: 'audit_status',
      question: 'コード監査を受けましたか？',
      type: 'select',
      options: [
        { value: 'none', label: 'いいえ、まだです' },
        { value: 'planned', label: '計画中です' },
        { value: 'completed', label: 'はい、完了しました' }
      ]
    }
  ] : [
    {
      id: 'protocol_type',
      question: 'What type of protocol are you building?',
      type: 'select',
      options: [
        { value: 'amm', label: 'AMM / DEX' },
        { value: 'lending', label: 'Lending / Borrowing' },
        { value: 'bridge', label: 'Cross-chain bridge' },
        { value: 'l2', label: 'L2 / Rollup' },
        { value: 'governance', label: 'Governance / DAO' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'stage',
      question: 'What stage is your protocol at?',
      type: 'select',
      options: [
        { value: 'design', label: 'Design phase (no code yet)' },
        { value: 'prototype', label: 'Prototype' },
        { value: 'testnet', label: 'Testnet' },
        { value: 'mainnet', label: 'Live on mainnet' }
      ]
    },
    {
      id: 'value_at_risk',
      question: 'Expected TVL (Total Value Locked)?',
      type: 'select',
      options: [
        { value: 'low', label: 'Under $1M' },
        { value: 'medium', label: '$1M - $50M' },
        { value: 'high', label: '$50M - $500M' },
        { value: 'very_high', label: 'Over $500M' }
      ]
    },
    {
      id: 'concerns',
      question: 'What areas concern you most? (select all that apply)',
      type: 'checkbox',
      options: [
        { value: 'economic', label: 'Economic incentives and fees' },
        { value: 'oracle', label: 'Oracles and data feeds' },
        { value: 'governance', label: 'Governance and permissions' },
        { value: 'mev', label: 'MEV and ordering' },
        { value: 'edge_cases', label: 'Edge cases and boundary conditions' },
        { value: 'composability', label: 'Interactions with other protocols' }
      ]
    },
    {
      id: 'audit_status',
      question: 'Have you had a code audit?',
      type: 'select',
      options: [
        { value: 'none', label: 'No, not yet' },
        { value: 'planned', label: 'Planned' },
        { value: 'completed', label: 'Yes, completed' }
      ]
    }
  ];

  let currentStep = -1;
  let answers = {};

  function renderStart() {
    container.innerHTML = `
      <div class="wizard-start" style="text-align: center; padding: var(--ds-space-8) var(--ds-space-4);">
        <p style="font-size: var(--ds-font-size-lg); margin-bottom: var(--ds-space-6); color: var(--ds-color-text-muted);">
          ${isJP 
            ? 'この評価には約2分かかります。回答に基づいて、カスタマイズされたリスクサマリーと推奨事項を提供します。'
            : 'This assessment takes about 2 minutes. You\'ll receive a customized risk summary and recommendations based on your answers.'}
        </p>
        <button class="button ds-button" onclick="window.demoWizard.start()">
          ${i18n.start}
        </button>
      </div>
    `;
  }

  function renderQuestion() {
    const q = questions[currentStep];
    const progress = `${i18n.progress} ${currentStep + 1} ${i18n.of} ${questions.length}`;
    
    let optionsHTML = '';
    if (q.type === 'select') {
      optionsHTML = `
        <select id="answer-${q.id}" class="wizard-select" style="width: 100%; padding: var(--ds-space-3); border-radius: var(--ds-radius-md); border: 1px solid var(--ds-color-border); font-size: var(--ds-font-size-md); margin-top: var(--ds-space-3);">
          <option value="">${isJP ? '選択してください...' : 'Select...'}</option>
          ${q.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
        </select>
      `;
    } else if (q.type === 'checkbox') {
      optionsHTML = `
        <div style="margin-top: var(--ds-space-4); display: grid; gap: var(--ds-space-3);">
          ${q.options.map(opt => `
            <label style="display: flex; align-items: center; gap: var(--ds-space-2); cursor: pointer;">
              <input type="checkbox" name="answer-${q.id}" value="${opt.value}" style="width: 18px; height: 18px;">
              <span>${opt.label}</span>
            </label>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="wizard-question">
        <div style="text-align: center; font-size: var(--ds-font-size-sm); color: var(--ds-color-text-muted); margin-bottom: var(--ds-space-4);">
          ${progress}
        </div>
        <div style="height: 4px; background: var(--ds-color-surface-muted); border-radius: var(--ds-radius-full); margin-bottom: var(--ds-space-6); overflow: hidden;">
          <div style="height: 100%; background: var(--ds-color-accent); width: ${((currentStep + 1) / questions.length) * 100}%; transition: width 0.3s ease;"></div>
        </div>
        <h3 style="font-size: var(--ds-font-size-xl); margin-bottom: var(--ds-space-4);">${q.question}</h3>
        ${optionsHTML}
        <div style="display: flex; gap: var(--ds-space-3); margin-top: var(--ds-space-6); justify-content: space-between;">
          ${currentStep > 0 ? `<button class="button ds-button ds-button--secondary" onclick="window.demoWizard.prev()">${i18n.prev}</button>` : '<div></div>'}
          <button class="button ds-button" onclick="window.demoWizard.next()" id="next-btn">
            ${currentStep === questions.length - 1 ? i18n.finish : i18n.next}
          </button>
        </div>
      </div>
    `;

    // Restore previous answers
    if (answers[q.id]) {
      if (q.type === 'select') {
        document.getElementById(`answer-${q.id}`).value = answers[q.id];
      } else if (q.type === 'checkbox') {
        answers[q.id].forEach(val => {
          const checkbox = document.querySelector(`input[name="answer-${q.id}"][value="${val}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
    }
  }

  function captureAnswer() {
    const q = questions[currentStep];
    if (q.type === 'select') {
      const select = document.getElementById(`answer-${q.id}`);
      answers[q.id] = select.value;
      return select.value !== '';
    } else if (q.type === 'checkbox') {
      const checkboxes = document.querySelectorAll(`input[name="answer-${q.id}"]:checked`);
      answers[q.id] = Array.from(checkboxes).map(cb => cb.value);
      return answers[q.id].length > 0;
    }
    return false;
  }

  function generateSummary() {
    const risks = [];
    const recommendations = [];

    // Generate risks based on answers
    if (answers.protocol_type === 'amm') {
      risks.push(isJP 
        ? '価格設定式の不変条件とMEV抽出の可能性'
        : 'Pricing formula invariants and MEV extraction potential');
    } else if (answers.protocol_type === 'bridge') {
      risks.push(isJP
        ? 'バリデータ共謀リスクとメッセージリプレイ攻撃'
        : 'Validator collusion risks and message replay attacks');
    } else if (answers.protocol_type === 'l2') {
      risks.push(isJP
        ? 'シーケンサーの中央集権化とデータ可用性の仮定'
        : 'Sequencer centralization and data availability assumptions');
    }

    if (answers.value_at_risk === 'high' || answers.value_at_risk === 'very_high') {
      risks.push(isJP
        ? '高いTVLは経済的攻撃の動機を増加させます'
        : 'High TVL increases economic attack motivation');
      recommendations.push(isJP
        ? '形式的検証による重要な不変条件の証明を検討'
        : 'Consider formal verification of critical invariants');
    }

    if (answers.concerns && answers.concerns.includes('economic')) {
      risks.push(isJP
        ? 'インセンティブの不整合により予期しない動作が発生する可能性'
        : 'Incentive misalignments may lead to unexpected behavior');
      recommendations.push(isJP
        ? '様々なシナリオでのゲーム理論分析が推奨されます'
        : 'Game-theoretic analysis under various scenarios recommended');
    }

    if (answers.concerns && answers.concerns.includes('oracle')) {
      risks.push(isJP
        ? 'オラクル障害またはデータフィード操作への依存'
        : 'Dependence on oracle failures or data feed manipulation');
    }

    if (answers.stage === 'design' || answers.stage === 'prototype') {
      recommendations.push(isJP
        ? '早期段階での設計レベル分析が最も効果的です'
        : 'Design-level analysis is most effective at this early stage');
    }

    if (answers.audit_status === 'completed') {
      recommendations.push(isJP
        ? 'コード監査は完了していますが、設計レベルのレビューで追加の保証が得られます'
        : 'Code audit complete, but design-level review provides additional assurance');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const summaryMD = isJP ? `# プロトコルリスクサマリー

**生成日:** ${timestamp}  
**プロトコルタイプ:** ${answers.protocol_type || 'N/A'}  
**ステージ:** ${answers.stage || 'N/A'}

## 主要なリスク領域

${risks.map(r => `- ${r}`).join('\n')}

## 推奨事項

${recommendations.map(r => `- ${r}`).join('\n')}

---

**注:** これは簡易評価です。包括的な分析については、[Inferaraにお問い合わせください](https://inferara.com/jp/contact/#request-analysis)。
` : `# Protocol Risk Summary

**Generated:** ${timestamp}  
**Protocol Type:** ${answers.protocol_type || 'N/A'}  
**Stage:** ${answers.stage || 'N/A'}

## Key Risk Areas

${risks.map(r => `- ${r}`).join('\n')}

## Recommendations

${recommendations.map(r => `- ${r}`).join('\n')}

---

**Note:** This is a preliminary assessment. For comprehensive analysis, [contact Inferara](https://inferara.com/en/contact/#request-analysis).
`;

    return summaryMD;
  }

  function renderSummary() {
    const summary = generateSummary();
    const risks = [];
    const recommendations = [];

    // Parse for HTML display
    const lines = summary.split('\n');
    let inRisks = false;
    let inRecommendations = false;

    lines.forEach(line => {
      if (line.includes(isJP ? '主要なリスク領域' : 'Key Risk Areas')) {
        inRisks = true;
        inRecommendations = false;
      } else if (line.includes(isJP ? '推奨事項' : 'Recommendations')) {
        inRisks = false;
        inRecommendations = true;
      } else if (line.startsWith('- ')) {
        if (inRisks) risks.push(line.substring(2));
        if (inRecommendations) recommendations.push(line.substring(2));
      }
    });

    container.innerHTML = `
      <div class="wizard-summary">
        <div style="text-align: center; margin-bottom: var(--ds-space-6);">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: var(--ds-radius-full); background: var(--ds-color-accent-soft); margin-bottom: var(--ds-space-4);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--ds-color-accent);">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h3 style="font-size: var(--ds-font-size-2xl); margin-bottom: var(--ds-space-2);">
            ${isJP ? 'リスクサマリー完了' : 'Risk Summary Complete'}
          </h3>
          <p style="color: var(--ds-color-text-muted);">
            ${isJP ? '回答に基づいた予備的な評価です' : 'Preliminary assessment based on your answers'}
          </p>
        </div>

        <div class="ds-card" style="margin-bottom: var(--ds-space-4);">
          <h4 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--ds-space-3); color: var(--ds-color-danger);">
            ${isJP ? '主要なリスク領域' : 'Key Risk Areas'}
          </h4>
          <ul style="margin: 0; padding-left: var(--ds-space-5); display: grid; gap: var(--ds-space-2);">
            ${risks.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <div class="ds-card" style="margin-bottom: var(--ds-space-6);">
          <h4 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--ds-space-3); color: var(--ds-color-success);">
            ${isJP ? '推奨事項' : 'Recommendations'}
          </h4>
          <ul style="margin: 0; padding-left: var(--ds-space-5); display: grid; gap: var(--ds-space-2);">
            ${recommendations.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <div style="display: flex; gap: var(--ds-space-3); flex-wrap: wrap; justify-content: center;">
          <button class="button ds-button" onclick="window.demoWizard.download()">
            ${i18n.download}
          </button>
          <button class="button ds-button ds-button--secondary" onclick="window.demoWizard.restart()">
            ${i18n.restart}
          </button>
          <a href="${isJP ? '/jp/contact/#request-analysis' : '/en/contact/#request-analysis'}" class="button ds-button">
            ${isJP ? '完全な分析をリクエスト' : 'Request Full Analysis'}
          </a>
        </div>
      </div>
    `;

    // Store summary for download
    container.dataset.summary = summary;
  }

  function downloadSummary() {
    const summary = container.dataset.summary;
    if (!summary) return;

    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-risk-summary-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Public API
  window.demoWizard = {
    start: function() {
      currentStep = 0;
      answers = {};
      renderQuestion();
    },
    next: function() {
      if (!captureAnswer()) {
        alert(isJP ? '回答を選択してください' : 'Please select an answer');
        return;
      }
      if (currentStep < questions.length - 1) {
        currentStep++;
        renderQuestion();
      } else {
        renderSummary();
      }
    },
    prev: function() {
      if (currentStep > 0) {
        currentStep--;
        renderQuestion();
      }
    },
    restart: function() {
      currentStep = -1;
      answers = {};
      renderStart();
    },
    download: downloadSummary
  };

  // Initialize
  renderStart();
})();
