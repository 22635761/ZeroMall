import os

# Fig 2: Bar chart comparing Static Regex Baseline vs. Multimodal CLIP Pipeline across 5 evasion subsets
svg_fig2 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 420" width="750" height="420" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <rect width="750" height="420" fill="#ffffff"/>
  
  <!-- Title -->
  <text x="375" y="30" fill="#1e293b" font-size="14" font-weight="700" text-anchor="middle">Interception &amp; Accuracy Rate Across Evasion Techniques (%)</text>
  
  <!-- Legend -->
  <g transform="translate(230, 48)">
    <rect x="0" y="0" width="16" height="12" fill="#94a3b8" rx="2"/>
    <text x="24" y="10" fill="#475569" font-size="11" font-weight="600">Static Regex Baseline</text>
    
    <rect x="180" y="0" width="16" height="12" fill="#0f766e" rx="2"/>
    <text x="204" y="10" fill="#0f766e" font-size="11" font-weight="700">Multimodal CLIP Pipeline (Ours)</text>
  </g>

  <!-- Y-Axis Grid Lines & Labels -->
  <g stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4">
    <line x1="80" y1="90" x2="700" y2="90"/>
    <line x1="80" y1="145" x2="700" y2="145"/>
    <line x1="80" y1="200" x2="700" y2="200"/>
    <line x1="80" y1="255" x2="700" y2="255"/>
    <line x1="80" y1="310" x2="700" y2="310"/>
  </g>

  <!-- Y Axis Labels -->
  <text x="70" y="94" fill="#64748b" font-size="10" text-anchor="end">100%</text>
  <text x="70" y="149" fill="#64748b" font-size="10" text-anchor="end">75%</text>
  <text x="70" y="204" fill="#64748b" font-size="10" text-anchor="end">50%</text>
  <text x="70" y="259" fill="#64748b" font-size="10" text-anchor="end">25%</text>
  <text x="70" y="314" fill="#64748b" font-size="10" text-anchor="end">0%</text>

  <!-- Solid Axes -->
  <line x1="80" y1="90" x2="80" y2="310" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="80" y1="310" x2="700" y2="310" stroke="#94a3b8" stroke-width="1.5"/>

  <!-- BAR GROUP 1: EXPLICIT_PROHIBITED (Baseline: 30%, Ours: 100%) -->
  <!-- 100% = 220px height, so 1% = 2.2px. y = 310 - (val * 2.2) -->
  <g transform="translate(100, 0)">
    <rect x="0" y="244" width="38" height="66" fill="#94a3b8" rx="3"/>
    <text x="19" y="238" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">30%</text>
    
    <rect x="44" y="90" width="38" height="220" fill="#0f766e" rx="3"/>
    <text x="63" y="84" fill="#0f766e" font-size="10" font-weight="700" text-anchor="middle">100%</text>
    
    <text x="41" y="330" fill="#1e293b" font-size="10" font-weight="600" text-anchor="middle">EXPLICIT</text>
    <text x="41" y="344" fill="#64748b" font-size="9" text-anchor="middle">PROHIBITED (n=10)</text>
  </g>

  <!-- BAR GROUP 2: MULTI_IMAGE_POISONING (Baseline: 13.3%, Ours: 100%) -->
  <g transform="translate(225, 0)">
    <rect x="0" y="280.7" width="38" height="29.3" fill="#94a3b8" rx="3"/>
    <text x="19" y="274.7" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">13%</text>
    
    <rect x="44" y="90" width="38" height="220" fill="#0f766e" rx="3"/>
    <text x="63" y="84" fill="#0f766e" font-size="10" font-weight="700" text-anchor="middle">100%</text>
    
    <text x="41" y="330" fill="#1e293b" font-size="10" font-weight="600" text-anchor="middle">MULTI-IMAGE</text>
    <text x="41" y="344" fill="#64748b" font-size="9" text-anchor="middle">POISONING (n=15)</text>
  </g>

  <!-- BAR GROUP 3: CROSS_MODAL_MISMATCH (Baseline: 0%, Ours: 96%) -->
  <g transform="translate(350, 0)">
    <rect x="0" y="308" width="38" height="2" fill="#94a3b8" rx="1"/>
    <text x="19" y="302" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">0%</text>
    
    <rect x="44" y="98.8" width="38" height="211.2" fill="#0f766e" rx="3"/>
    <text x="63" y="92.8" fill="#0f766e" font-size="10" font-weight="700" text-anchor="middle">96%</text>
    
    <text x="41" y="330" fill="#1e293b" font-size="10" font-weight="600" text-anchor="middle">CROSS-MODAL</text>
    <text x="41" y="344" fill="#64748b" font-size="9" text-anchor="middle">MISMATCH (n=25)</text>
  </g>

  <!-- BAR GROUP 4: ADVERSARIAL_TEXT (Baseline: 25%, Ours: 90%) -->
  <g transform="translate(475, 0)">
    <rect x="0" y="255" width="38" height="55" fill="#94a3b8" rx="3"/>
    <text x="19" y="249" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">25%</text>
    
    <rect x="44" y="112" width="38" height="198" fill="#0f766e" rx="3"/>
    <text x="63" y="106" fill="#0f766e" font-size="10" font-weight="700" text-anchor="middle">90%</text>
    
    <text x="41" y="330" fill="#1e293b" font-size="10" font-weight="600" text-anchor="middle">ADVERSARIAL</text>
    <text x="41" y="344" fill="#64748b" font-size="9" text-anchor="middle">TEXT (n=20)</text>
  </g>

  <!-- BAR GROUP 5: CLEAN_VALID (Baseline: 93.3%, Ours: 90%) -->
  <g transform="translate(600, 0)">
    <rect x="0" y="104.7" width="38" height="205.3" fill="#94a3b8" rx="3"/>
    <text x="19" y="98.7" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">93.3%</text>
    
    <rect x="44" y="112" width="38" height="198" fill="#0f766e" rx="3"/>
    <text x="63" y="106" fill="#0f766e" font-size="10" font-weight="700" text-anchor="middle">90%</text>
    
    <text x="41" y="330" fill="#1e293b" font-size="10" font-weight="600" text-anchor="middle">CLEAN</text>
    <text x="41" y="344" fill="#64748b" font-size="9" text-anchor="middle">VALID (n=30)</text>
  </g>

  <!-- Footnote -->
  <text x="375" y="395" fill="#64748b" font-size="10.5" font-style="italic" text-anchor="middle">Fig. 2. Performance comparison between Static Regex Baseline and Multimodal CLIP Pipeline across evasion categories.</text>
</svg>
'''

with open('fig2_evasion_performance.svg', 'w', encoding='utf-8') as f:
    f.write(svg_fig2)
print('Generated fig2_evasion_performance.svg successfully!')

# Fig 3: Error bar chart for Likert 5-point evaluation agreement rates with 95% Wilson CI
svg_fig3 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 360" width="750" height="360" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <rect width="750" height="360" fill="#ffffff"/>

  <!-- Title -->
  <text x="375" y="28" fill="#1e293b" font-size="14" font-weight="700" text-anchor="middle">Administrator Likert Agreement Rates (Score 4–5) with 95% Wilson CI</text>

  <!-- X-Axis Grid Lines & Labels (Scale: 70% to 100%) -->
  <!-- 70% at x=260, 100% at x=680. Width = 420px for 30%. 1% = 14px. x = 260 + (val - 70) * 14 -->
  <g stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4">
    <line x1="260" y1="50" x2="260" y2="280"/>
    <line x1="330" y1="50" x2="330" y2="280"/>
    <line x1="400" y1="50" x2="400" y2="280"/>
    <line x1="470" y1="50" x2="470" y2="280"/>
    <line x1="540" y1="50" x2="540" y2="280"/>
    <line x1="610" y1="50" x2="610" y2="280"/>
    <line x1="680" y1="50" x2="680" y2="280"/>
  </g>

  <text x="260" y="300" fill="#64748b" font-size="10" text-anchor="middle">70%</text>
  <text x="330" y="300" fill="#64748b" font-size="10" text-anchor="middle">75%</text>
  <text x="400" y="300" fill="#64748b" font-size="10" text-anchor="middle">80%</text>
  <text x="470" y="300" fill="#64748b" font-size="10" text-anchor="middle">85%</text>
  <text x="540" y="300" fill="#64748b" font-size="10" text-anchor="middle">90%</text>
  <text x="610" y="300" fill="#64748b" font-size="10" text-anchor="middle">95%</text>
  <text x="680" y="300" fill="#64748b" font-size="10" text-anchor="middle">100%</text>
  <text x="470" y="318" fill="#475569" font-size="11" font-weight="600" text-anchor="middle">Agreement Rate (Proportion Rating 4 or 5)</text>

  <!-- Vertical Reference Line at 80% & Neutral baseline -->
  <line x1="260" y1="280" x2="680" y2="280" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="260" y1="50" x2="260" y2="280" stroke="#94a3b8" stroke-width="1.5"/>

  <!-- ROW 1: Q1 (Verdict Accuracy): 94.0%, CI: [87.5%, 97.2%] -->
  <!-- x_mean = 260 + 24 * 14 = 596. x_low = 260 + 17.5 * 14 = 505. x_high = 260 + 27.2 * 14 = 640.8 -->
  <g transform="translate(0, 75)">
    <text x="245" y="5" fill="#1e293b" font-size="11" font-weight="600" text-anchor="end">Q1: Verdict Accuracy</text>
    <!-- Bar -->
    <rect x="260" y="-8" width="336" height="16" fill="#e0f2fe" rx="3"/>
    <!-- CI Error line -->
    <line x1="505" y1="0" x2="640.8" y2="0" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="505" y1="-6" x2="505" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="640.8" y1="-6" x2="640.8" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <!-- Point marker -->
    <circle cx="596" cy="0" r="4.5" fill="#0369a1"/>
    <text x="650" y="4" fill="#0369a1" font-size="10.5" font-weight="700">94.0% [87.5–97.2]</text>
  </g>

  <!-- ROW 2: Q2 (Explanation Clarity): 92.0%, CI: [85.0%, 95.9%] -->
  <!-- x_mean = 260 + 22 * 14 = 568. x_low = 260 + 15 * 14 = 470. x_high = 260 + 25.9 * 14 = 622.6 -->
  <g transform="translate(0, 120)">
    <text x="245" y="5" fill="#1e293b" font-size="11" font-weight="600" text-anchor="end">Q2: Explanation Clarity</text>
    <rect x="260" y="-8" width="308" height="16" fill="#e0f2fe" rx="3"/>
    <line x1="470" y1="0" x2="622.6" y2="0" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="470" y1="-6" x2="470" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="622.6" y1="-6" x2="622.6" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <circle cx="568" cy="0" r="4.5" fill="#0369a1"/>
    <text x="632" y="4" fill="#0369a1" font-size="10.5" font-weight="700">92.0% [85.0–95.9]</text>
  </g>

  <!-- ROW 3: Q3 (Evidence Grounding): 95.0%, CI: [88.8%, 97.8%] -->
  <!-- x_mean = 260 + 25 * 14 = 610. x_low = 260 + 18.8 * 14 = 523.2. x_high = 260 + 27.8 * 14 = 649.2 -->
  <g transform="translate(0, 165)">
    <text x="245" y="5" fill="#1e293b" font-size="11" font-weight="600" text-anchor="end">Q3: Evidence Grounding</text>
    <rect x="260" y="-8" width="350" height="16" fill="#e0f2fe" rx="3"/>
    <line x1="523.2" y1="0" x2="649.2" y2="0" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="523.2" y1="-6" x2="523.2" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="649.2" y1="-6" x2="649.2" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <circle cx="610" cy="0" r="4.5" fill="#0369a1"/>
    <text x="658" y="4" fill="#0369a1" font-size="10.5" font-weight="700">95.0% [88.8–97.8]</text>
  </g>

  <!-- ROW 4: Q4 (Action Suitability): 96.0%, CI: [90.2%, 98.4%] -->
  <!-- x_mean = 260 + 26 * 14 = 624. x_low = 260 + 20.2 * 14 = 542.8. x_high = 260 + 28.4 * 14 = 657.6 -->
  <g transform="translate(0, 210)">
    <text x="245" y="5" fill="#1e293b" font-size="11" font-weight="600" text-anchor="end">Q4: Action Suitability</text>
    <rect x="260" y="-8" width="364" height="16" fill="#e0f2fe" rx="3"/>
    <line x1="542.8" y1="0" x2="657.6" y2="0" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="542.8" y1="-6" x2="542.8" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <line x1="657.6" y1="-6" x2="657.6" y2="6" stroke="#0284c7" stroke-width="2.5"/>
    <circle cx="624" cy="0" r="4.5" fill="#0369a1"/>
    <text x="666" y="4" fill="#0369a1" font-size="10.5" font-weight="700">96.0% [90.2–98.4]</text>
  </g>

  <!-- ROW 5: OVERALL SYSTEM: 94.2%, CI: [89.8%, 96.8%] -->
  <!-- x_mean = 260 + 24.2 * 14 = 598.8. x_low = 260 + 19.8 * 14 = 537.2. x_high = 260 + 26.8 * 14 = 635.2 -->
  <g transform="translate(0, 255)">
    <text x="245" y="5" fill="#0f766e" font-size="11.5" font-weight="700" text-anchor="end">OVERALL SYSTEM</text>
    <rect x="260" y="-8" width="338.8" height="16" fill="#ccfbf1" rx="3"/>
    <line x1="537.2" y1="0" x2="635.2" y2="0" stroke="#0f766e" stroke-width="3"/>
    <line x1="537.2" y1="-7" x2="537.2" y2="7" stroke="#0f766e" stroke-width="3"/>
    <line x1="635.2" y1="-7" x2="635.2" y2="7" stroke="#0f766e" stroke-width="3"/>
    <circle cx="598.8" cy="0" r="5" fill="#0f766e"/>
    <text x="646" y="4" fill="#0f766e" font-size="11" font-weight="800">94.2% [89.8–96.8]</text>
  </g>

  <!-- Footnote -->
  <text x="375" y="348" fill="#64748b" font-size="10.5" font-style="italic" text-anchor="middle">Fig. 3. Proportion of positive administrator evaluations (Likert 4 or 5) with 95% Wilson confidence intervals.</text>
</svg>
'''

with open('fig3_likert_wilson_ci.svg', 'w', encoding='utf-8') as f:
    f.write(svg_fig3)
print('Generated fig3_likert_wilson_ci.svg successfully!')
