let currentSteps = [];
let currentStepIndex = 0;
let selectedOp = null;
let selectedOps = []; // Nuova gestione operatori singoli
let fractionCount = 2;

// --- SYSTEMA ANIMAZIONE ---
let animationInterval = null;
let isAnimating = false;
let currentAnimFrame = 0;
let renderedFrameIndex = -1;

// --- UTILITY MATEMATICHE ---
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const lcm = (a, b) => (a * b) / gcd(a, b);

/**
 * Scomposizione in fattori primi con passaggi dettagliati
 */
function primeFactorsWithSteps(n) {
    let num = Math.abs(n);
    let steps = [];
    let factors = [];
    let temp = num;
    
    while (temp % 2 === 0) {
        steps.push({ numero: temp, divisore: 2, quoziente: temp / 2, resto: 0 });
        factors.push(2);
        temp = temp / 2;
    }
    
    for (let i = 3; i * i <= temp; i += 2) {
        while (temp % i === 0) {
            steps.push({ numero: temp, divisore: i, quoziente: temp / i, resto: 0 });
            factors.push(i);
            temp = temp / i;
        }
    }
    
    if (temp > 1) {
        steps.push({ numero: temp, divisore: temp, quoziente: 1, resto: 0 });
        factors.push(temp);
    }
    
    return { steps, factors };
}

function getPrimeFactorsWithExponents(n) {
    const { factors } = primeFactorsWithSteps(n);
    const expMap = {};
    factors.forEach(f => {
        expMap[f] = (expMap[f] || 0) + 1;
    });
    return expMap;
}

/**
 * Costruisce passaggi visivi per il calcolo del mcm con fattorizzazione
 */
function buildMCMDetailedSteps(numbers) {
    let steps = [];
    let nums = numbers.map(n => Math.abs(n));
    
    let factorizations = nums.map(n => {
        const { steps: fSteps, factors } = primeFactorsWithSteps(n);
        return { num: n, steps: fSteps, factors };
    });
    
    let allExponents = {};
    factorizations.forEach(f => {
        const expMap = getPrimeFactorsWithExponents(f.num);
        Object.keys(expMap).forEach(prime => {
            allExponents[prime] = Math.max(allExponents[prime] || 0, expMap[prime]);
        });
    });
    
    let mcmValue = 1;
    let mcmFactors = [];
    Object.keys(allExponents).sort((a, b) => parseInt(a) - parseInt(b)).forEach(prime => {
        const exp = allExponents[prime];
        mcmValue *= Math.pow(parseInt(prime), exp);
        mcmFactors.push(`${prime}^${exp}`);
    });
    
    // --- Passaggio 1: Introduzione ---
    let step1Blocks = [];
    step1Blocks.push({ type: 'op', val: 'Denominatori:', hl: ['val'], dim: [] });
    nums.forEach((n, idx) => {
        if (idx > 0) step1Blocks.push({ type: 'op', val: ',', dim: ['val'] });
        step1Blocks.push({ type: 'op', val: n.toString(), hl: ['val'], dim: [] });
    });
    step1Blocks.push({ type: 'op', val: '→', dim: ['val'] });
    step1Blocks.push({ type: 'op', val: 'mcm = ?', hl: ['val'], dim: [] });
    
    let anim1 = [];
    let f1_0 = JSON.parse(JSON.stringify(step1Blocks));
    f1_0.forEach((b, idx) => {
        if (idx === 0) { b.hl = ['val']; b.dim = []; b.circle = ['val']; }
        else if (idx >= 1 && idx <= nums.length && b.val !== ',' && b.val !== '→') { 
            b.hl = ['val']; b.dim = []; b.circle = ['val']; 
        }
        else if (idx === step1Blocks.length - 1) { b.hl = ['val']; b.dim = []; }
        else { b.hl = []; b.dim = ['val']; }
    });
    anim1.push({ txtId: 'mcm-intro-0', blocks: f1_0 });
    
    steps.push({
        description: `<span id="mcm-intro-0" class="anim-text"><strong>Passaggio 1:</strong> Troviamo il <strong>Minimo Comune Multiplo (mcm)</strong> dei denominatori (${nums.join(', ')}).</span><br>` +
                     `<span id="mcm-intro-1" class="anim-text">Scomponiamo ogni denominatore in <strong>fattori primi</strong>.</span>`,
        blocks: step1Blocks,
        animation: anim1
    });
    
    // --- Passaggi 2..N: Scomposizione di ogni numero ---
    for (let i = 0; i < factorizations.length; i++) {
        const f = factorizations[i];
        
        let stepBlocks = [];
        stepBlocks.push({ type: 'op', val: f.num.toString(), hl: ['val'], dim: [] });
        stepBlocks.push({ type: 'op', val: '=', dim: ['val'] });
        let factorStr = f.factors.join(' × ');
        stepBlocks.push({ type: 'op', val: factorStr, hl: ['val'], dim: [] });
        
        let animFrames = [];
        
        let f0 = JSON.parse(JSON.stringify(stepBlocks));
        f0.forEach((b, idx) => {
            if (idx === 0) { b.hl = ['val']; b.dim = []; b.circle = ['val']; }
            else { b.hl = []; b.dim = ['val']; }
        });
        animFrames.push({ txtId: `mcm-fact-${i}-0`, blocks: f0 });
        
        let f1 = JSON.parse(JSON.stringify(stepBlocks));
        f1.forEach((b, idx) => {
            if (idx === 2) { b.hl = ['val']; b.dim = []; b.circle = ['val']; }
            else { b.hl = []; b.dim = ['val']; }
        });
        animFrames.push({ txtId: `mcm-fact-${i}-1`, blocks: f1 });
        
        // Tabella di scomposizione
        let tableHtml = '<div class="factorization-table" style="margin-top: 10px; font-size: 1.2rem;">';
        tableHtml += '<table style="border-collapse: collapse; margin: 0 auto; border: 2px solid var(--primary-blue); border-radius: 8px; overflow: hidden;">';
        tableHtml += '<tr style="background: var(--primary-blue); color: white;"><th style="padding: 8px 16px; border: 1px solid #fff;">Numero</th><th style="padding: 8px 16px; border: 1px solid #fff;">Divisore</th><th style="padding: 8px 16px; border: 1px solid #fff;">Quoziente</th></tr>';
        
        let temp = f.num;
        f.factors.forEach(fact => {
            tableHtml += `<tr style="background: #FFF;"><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${temp}</td><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; color: var(--accent-red); font-weight: bold;">${fact}</td><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center;">${temp / fact}</td></tr>`;
            temp = temp / fact;
        });
        tableHtml += '<tr style="background: #E3F2FD;"><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; font-weight: bold;">1</td><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; color: green; font-weight: bold;">✓</td><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center;">Fatto!</td></tr>';
        tableHtml += '</table></div>';
        
        steps.push({
            description: `<span id="mcm-fact-${i}-0" class="anim-text"><strong>Passaggio ${i + 2}:</strong> Scomponiamo <strong>${f.num}</strong> in fattori primi.</span><br>` +
                         `<span id="mcm-fact-${i}-1" class="anim-text">${f.num} = <strong>${factorStr}</strong></span>` +
                         tableHtml,
            blocks: stepBlocks,
            animation: animFrames
        });
    }
    
    // --- Passaggio finale: Combinazione ---
    let finalBlocks = [];
    finalBlocks.push({ type: 'op', val: 'Denominatori:', hl: ['val'], dim: [] });
    nums.forEach((n, idx) => {
        if (idx > 0) finalBlocks.push({ type: 'op', val: ',', dim: ['val'] });
        finalBlocks.push({ type: 'op', val: n.toString(), hl: ['val'], dim: [] });
    });
    finalBlocks.push({ type: 'op', val: '→', dim: ['val'] });
    finalBlocks.push({ type: 'op', val: `mcm = ${mcmValue}`, hl: ['val'], dim: [] });
    
    let animFinal = [];
    let ff0 = JSON.parse(JSON.stringify(finalBlocks));
    ff0.forEach((b, idx) => {
        if (idx === finalBlocks.length - 1) { b.hl = ['val']; b.dim = []; b.circle = ['val']; }
        else { b.hl = []; b.dim = ['val']; }
    });
    animFinal.push({ txtId: 'mcm-final-0', blocks: ff0 });
    
    // Griglia comparativa dei fattori
    let gridHtml = '<div class="factor-comparison-grid" style="margin-top: 15px; font-size: 1.1rem;">';
    gridHtml += '<p style="font-weight: bold; margin-bottom: 8px;">📊 Griglia comparativa dei fattori primi:</p>';
    gridHtml += '<table style="border-collapse: collapse; margin: 0 auto; border: 2px solid var(--primary-blue); border-radius: 8px; overflow: hidden;">';
    gridHtml += '<tr style="background: var(--primary-blue); color: white;"><th style="padding: 8px 16px; border: 1px solid #fff;">Fattore</th>';
    nums.forEach(n => {
        gridHtml += `<th style="padding: 8px 16px; border: 1px solid #fff;">${n}</th>`;
    });
    gridHtml += '<th style="padding: 8px 16px; border: 1px solid #fff; background: var(--accent-red);">mcm</th></tr>';
    
    Object.keys(allExponents).sort((a, b) => parseInt(a) - parseInt(b)).forEach(prime => {
        gridHtml += `<tr style="background: #FFF;"><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${prime}</td>`;
        nums.forEach(n => {
            const expMap = getPrimeFactorsWithExponents(n);
            const exp = expMap[prime] || 0;
            const cellStyle = exp === allExponents[prime] ? 'background: #C8E6C9; font-weight: bold;' : '';
            gridHtml += `<td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; ${cellStyle}">${exp > 0 ? `${prime}^${exp}` : '-'}</td>`;
        });
        gridHtml += `<td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; background: #FFCDD2; font-weight: bold; color: var(--accent-red);">${prime}^${allExponents[prime]}</td>`;
        gridHtml += '</tr>';
    });
    
    gridHtml += `<tr style="background: #E3F2FD;"><td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; font-weight: bold;">mcm</td>`;
    nums.forEach(() => {
        gridHtml += `<td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center;">-</td>`;
    });
    gridHtml += `<td style="padding: 8px 16px; border: 1px solid #ddd; text-align: center; background: #FFCDD2; font-weight: bold; color: var(--accent-red); font-size: 1.3rem;">${mcmValue}</td>`;
    gridHtml += '</tr></table></div>';
    
    let mcmFormula = mcmFactors.join(' × ');
    
    steps.push({
        description: `<span id="mcm-final-0" class="anim-text"><strong>Risultato:</strong> Prendiamo ogni fattore primo con l'<strong>esponente più grande</strong>.</span><br>` +
                     `<span id="mcm-final-1" class="anim-text">Calcoliamo: ${mcmFormula} = <strong>${mcmValue}</strong></span>` +
                     gridHtml,
        blocks: finalBlocks,
        animation: animFinal
    });
    
    return steps;
}

const getFractionType = (n, d) => {
    if (d === 0) return "non definita";
    if (n % d === 0) return "apparente";
    if (Math.abs(n) < Math.abs(d)) return "propria";
    return "impropria";
};

const getFractionDescription = (n, d, label) => {
    const type = getFractionType(n, d);
    if (type === "apparente") {
        return `La ${label} (<strong>${n}/${d}</strong>) è una <strong>frazione apparente</strong>: il numeratore (${n}) è un multiplo del denominatore (${d}) o uguale ad esso. Rappresenta uno o più interi esatti.`;
    } else if (type === "propria") {
        return `La ${label} (<strong>${n}/${d}</strong>) è una <strong>frazione propria</strong>: il numeratore (${n}) è più piccolo del denominatore (${d}). Rappresenta una quantità minore di un intero.`;
    } else {
        return `La ${label} (<strong>${n}/${d}</strong>) è una <strong>frazione impropria</strong>: il numeratore (${n}) è più grande del denominatore (${d}). Rappresenta una quantità maggiore di un intero.`;
    }
};

// --- GESTIONE DEI NUMERI DI FRAZIONI (Fase 1 Dinamica) ---

function getAndSaveValues() {
    let vals = [];
    for (let i = 1; i <= 4; i++) {
        const num = document.getElementById(`num${i}`);
        const den = document.getElementById(`den${i}`);
        if (num && den) {
            vals.push({ num: num.value, den: den.value });
        }
    }
    return vals;
}

function restoreValues(vals) {
    vals.forEach((v, idx) => {
        const i = idx + 1;
        const num = document.getElementById(`num${i}`);
        const den = document.getElementById(`den${i}`);
        if (num && den) {
            num.value = v.num;
            den.value = v.den;
        }
    });
}

function renderInputs() {
    const container = document.getElementById('fractions-row');
    container.innerHTML = '';
    
    if (selectedOps.length !== fractionCount - 1) {
        const defaultOp = selectedOp || '+';
        let newOps = [];
        for (let i = 0; i < fractionCount - 1; i++) {
            newOps.push(selectedOps[i] || defaultOp);
        }
        selectedOps = newOps;
    }
    
    for (let i = 1; i <= fractionCount; i++) {
        if (i > 1) {
            const opIndex = i - 2;
            const op = selectedOps[opIndex];
            let opSymbol = '+';
            if (op === '*') opSymbol = '×';
            else if (op === '/') opSymbol = '÷';
            else opSymbol = op;
            
            const opSelector = document.createElement('div');
            opSelector.className = 'op-selector';
            opSelector.innerHTML = `
                <button class="op-arr-btn up" data-index="${opIndex}" aria-label="Operatore precedente">▲</button>
                <span class="op-selector-val" id="op-val-${opIndex}">${opSymbol}</span>
                <button class="op-arr-btn down" data-index="${opIndex}" aria-label="Operatore successivo">▼</button>
            `;
            container.appendChild(opSelector);
        }
        
        const fracDiv = document.createElement('div');
        fracDiv.className = 'fraction-input';
        fracDiv.innerHTML = `
            <label for="num${i}" class="sr-only">Numeratore frazione ${i}</label>
            <input type="number" id="num${i}" placeholder="Num" aria-label="Numeratore frazione ${i}">
            <div class="fraction-line"></div>
            <label for="den${i}" class="sr-only">Denominatore frazione ${i}</label>
            <input type="number" id="den${i}" placeholder="Den" aria-label="Denominatore frazione ${i}">
        `;
        container.appendChild(fracDiv);
    }
    
    document.getElementById('btn-add-fraction').disabled = (fractionCount >= 4);
    document.getElementById('btn-remove-fraction').disabled = (fractionCount <= 2);
}

// --- CONNETTORI GRAFICI SVG ---

function clearVisualConnectors() {
    const svg = document.getElementById('connector-svg');
    if (svg) svg.innerHTML = '';
}

function drawVisualConnector(fromId, toId, opText) {
    const parent = document.getElementById('step-visual');
    if (!parent) return;
    
    let svg = document.getElementById('connector-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'connector-svg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '10';
        parent.appendChild(svg);
    }
    
    let defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="var(--accent-red)"/>
            </marker>
        `;
        svg.appendChild(defs);
    }
    
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    if (!fromEl || !toEl) return;
    
    const parentRect = parent.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const x1_ctr = fromRect.left - parentRect.left + fromRect.width / 2;
    const y1_ctr = fromRect.top - parentRect.top + fromRect.height / 2;
    const x2_ctr = toRect.left - parentRect.left + toRect.width / 2;
    const y2_ctr = toRect.top - parentRect.top + toRect.height / 2;
    
    const isVertical = Math.abs(x1_ctr - x2_ctr) < 15;
    
    let x1, y1, x2, y2, cx, cy;
    
    if (isVertical) {
        const sideOffset = 22;
        const curveOffset = 45;
        
        x1 = x1_ctr - sideOffset;
        y1 = y1_ctr;
        
        const isUpwards = y1_ctr > y2_ctr;
        x2 = x2_ctr - (sideOffset + (isUpwards ? 4 : 0));
        y2 = y2_ctr;
        
        cx = x1_ctr - curveOffset;
        cy = (y1_ctr + y2_ctr) / 2;
    } else {
        const Rx1 = (fromRect.width || 44) / 2;
        const Ry1 = (fromRect.height || 44) / 2;
        const Rx2 = (toRect.width || 44) / 2;
        const Ry2 = (toRect.height || 44) / 2;
        
        const isDownwardsCurve = fromId.endsWith('-d') || toId.endsWith('-d');
        const midX = (x1_ctr + x2_ctr) / 2;
        const tempCy = isDownwardsCurve ? (Math.max(y1_ctr, y2_ctr) + 40) : (Math.min(y1_ctr, y2_ctr) - 40);
        
        const angle1 = Math.atan2(tempCy - y1_ctr, midX - x1_ctr);
        const angle2 = Math.atan2(y2_ctr - tempCy, x2_ctr - midX);
        
        x1 = x1_ctr + (Rx1 + 6) * Math.cos(angle1);
        y1 = y1_ctr + (Ry1 + 6) * Math.sin(angle1);
        
        x2 = x2_ctr - (Rx2 + 12) * Math.cos(angle2);
        y2 = y2_ctr - (Ry2 + 12) * Math.sin(angle2);
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        cx = x1 + dx / 2;
        cy = tempCy;
    }
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--accent-red)');
    path.setAttribute('stroke-width', '4');
    path.setAttribute('marker-end', 'url(#arrow)');
    path.setAttribute('stroke-dasharray', '8,4');
    svg.appendChild(path);
    
    if (opText) {
        const textWidth = opText.length * 10 + 16;
        const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        textBg.setAttribute('x', cx - textWidth / 2);
        textBg.setAttribute('y', cy - 14);
        textBg.setAttribute('width', textWidth);
        textBg.setAttribute('height', 28);
        textBg.setAttribute('fill', '#FFFDD0');
        textBg.setAttribute('rx', 6);
        svg.appendChild(textBg);
 
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 7);
        text.setAttribute('fill', 'var(--accent-red)');
        text.setAttribute('font-size', '1.3rem');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('text-anchor', 'middle');
        text.style.fontFamily = "'Andika', sans-serif";
        text.textContent = opText;
        svg.appendChild(text);
    }
}

window.addEventListener('resize', () => {
    if (isAnimating && renderedFrameIndex !== -1) {
        const step = currentSteps[currentStepIndex];
        const frame = step.animation[renderedFrameIndex];
        if (frame && frame.connector) {
            clearVisualConnectors();
            if (Array.isArray(frame.connector)) {
                frame.connector.forEach(conn => {
                    drawVisualConnector(conn.from, conn.to, conn.text);
                });
            } else {
                drawVisualConnector(frame.connector.from, frame.connector.to, frame.connector.text);
            }
        }
    }
});

// Memorizza l'operazione originale completa per mostrarla in ogni passaggio
let originalOperationStr = '';
let originalFractions = [];
let originalOps = [];

// --- GESTIONE DEI PASSAGGI DI RISOLUZIONE ---

function getOpSymbol(op) {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
}

function buildOperationHeader(fractions, ops) {
    let parts = [];
    fractions.forEach((f, idx) => {
        if (idx > 0) parts.push(getOpSymbol(ops[idx - 1]));
        parts.push(`${f.num}/${f.den}`);
    });
    return parts.join(' ');
}

function buildStepsAddSub(fractions, ops) {
    let dens = fractions.map(f => f.den);
    let mcm = dens.reduce((acc, d) => lcm(acc, d), dens[0]);
    let newNums = fractions.map(f => (mcm / f.den) * f.num);
    
    let res_n = newNums[0];
    for (let i = 1; i < newNums.length; i++) {
        const op = ops[i - 1];
        if (op === '+') res_n += newNums[i];
        else res_n -= newNums[i];
    }
    
    // Salva l'operazione originale per mostrarla nell'header
    originalOperationStr = buildOperationHeader(fractions, ops);
    
    let steps = [];
    
    // --- Passaggi dettagliati MCM ---
    let mcmDetailedSteps = buildMCMDetailedSteps(dens);
    steps = steps.concat(mcmDetailedSteps);
    
    // --- Passaggio: Scriviamo il nuovo denominatore ---
    // Struttura: [Frazione1 originale] + [Frazione2 originale] = [?/mcm] + [?/mcm]
    let stepNewDenBlocks = [];
    // Lato sinistro: frazioni originali
    fractions.forEach((f, idx) => {
        if (idx > 0) {
            const opSym = ops[idx - 1] === '*' ? '×' : (ops[idx - 1] === '/' ? '÷' : ops[idx - 1]);
            stepNewDenBlocks.push({ type: 'op', val: opSym, dim: ['val'] });
        }
        stepNewDenBlocks.push({ type: 'frac', n: f.num, d: f.den, dim: ['n', 'd', 'line'] });
    });
    // Segno uguale
    stepNewDenBlocks.push({ type: 'op', val: '=', dim: ['val'] });
    // Lato destro: nuove frazioni con mcm
    fractions.forEach((f, idx) => {
        if (idx > 0) {
            const opSym = ops[idx - 1] === '*' ? '×' : (ops[idx - 1] === '/' ? '÷' : ops[idx - 1]);
            stepNewDenBlocks.push({ type: 'op', val: opSym, dim: ['val'] });
        }
        stepNewDenBlocks.push({ type: 'frac', n: '?', d: mcm, hl: ['d'], dim: ['n', 'line'] });
    });
    
    let animNewDen = [];
    let fnd0 = JSON.parse(JSON.stringify(stepNewDenBlocks));
    fnd0.forEach((b, idx) => {
        // Lato sinistro: frazioni originali (indice 0..2*fractions.length-1, con operatori intervallati)
        // Lato destro: dopo le frazioni originali + l'operatore =
        // Per 2 frazioni: 0=frac_orig, 1=op, 2=frac_orig, 3==, 4=frac_new, 5=op, 6=frac_new
        const isRightSide = idx >= 2 * fractions.length - 1 + 1; // dopo l'ultimo operatore/frac originale + =
        const isRightBlock = idx >= 2 * fractions.length; // a partire dall'= 
        if (b.type === 'frac' && isRightBlock) { b.circle = ['d']; b.hl = ['d']; b.dim = ['n', 'line']; }
        else if (b.type === 'frac' && !isRightBlock) { b.hl = []; b.dim = ['n', 'd', 'line']; }
        else { b.hl = []; b.dim = ['val']; }
    });
    animNewDen.push({ txtId: 'newden-0', blocks: fnd0 });
    
    steps.push({
        description: `<span id="newden-0" class="anim-text"><strong>Passaggio ${mcmDetailedSteps.length + 1}:</strong> Il mcm dei denominatori è <strong>${mcm}</strong>.</span><br>` +
                     `<span id="newden-1" class="anim-text">Scriviamo <strong>${mcm}</strong> come nuovo denominatore per tutte le frazioni.</span>`,
        blocks: stepNewDenBlocks,
        animation: animNewDen
    });
    
    // --- Passaggi da 2 a N+1: Conversione di ciascuna frazione ---
    let currentRightNums = fractions.map(() => '?');
    for (let i = 0; i < fractions.length; i++) {
        currentRightNums[i] = newNums[i];
        
        let stepBlocks = [];
        fractions.forEach((f, idx) => {
            if (idx > 0) {
                const currentOp = ops[idx - 1] === '*' ? '×' : (ops[idx - 1] === '/' ? '÷' : ops[idx - 1]);
                stepBlocks.push({ type: 'op', val: currentOp, dim: ['val'] });
            }
            if (idx === i) {
                stepBlocks.push({ type: 'frac', n: f.num, d: f.den, hl: ['n', 'd'], dim: ['line'] });
            } else {
                stepBlocks.push({ type: 'frac', n: f.num, d: f.den, dim: ['n', 'd', 'line'] });
            }
        });
        stepBlocks.push({ type: 'op', val: '=', dim: ['val'] });
        fractions.forEach((f, idx) => {
            if (idx > 0) {
                const currentOp = ops[idx - 1] === '*' ? '×' : (ops[idx - 1] === '/' ? '÷' : ops[idx - 1]);
                stepBlocks.push({ type: 'op', val: currentOp, dim: ['val'] });
            }
            if (idx === i) {
                stepBlocks.push({ type: 'frac', n: newNums[idx], d: mcm, hl: ['n', 'd'], dim: ['line'] });
            } else {
                stepBlocks.push({ type: 'frac', n: currentRightNums[idx], d: mcm, dim: ['n', 'd', 'line'] });
            }
        });
        
        let animFrames = [];
        
        let f0Blocks = JSON.parse(JSON.stringify(stepBlocks));
        f0Blocks.forEach((b, idx) => {
            let isOldI = (idx === 2 * i);
            let isNewI = (idx === 2 * fractions.length + 2 * i);
            if (isOldI || isNewI) {
                b.hl = ['n', 'd', 'line']; b.dim = [];
                b.circle = ['frac'];
            } else {
                b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
            }
        });
        animFrames.push({ 
            txtId: `a-txt-0-s${i}`, 
            blocks: f0Blocks,
            connector: { from: `block-${2 * i}`, to: `block-${2 * fractions.length + 2 * i}`, text: 'Trasforma ➔' }
        });
        
        let f1Blocks = JSON.parse(JSON.stringify(stepBlocks));
        f1Blocks.forEach((b, idx) => {
            let isOldI = (idx === 2 * i);
            let isNewI = (idx === 2 * fractions.length + 2 * i);
            if (isOldI || isNewI) {
                b.hl = ['d']; b.dim = ['n', 'line'];
                b.circle = ['d'];
            } else {
                b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
            }
        });
        animFrames.push({ 
            txtId: `a-txt-1-s${i}`, 
            blocks: f1Blocks,
            connector: { from: `block-${2 * fractions.length + 2 * i}-d`, to: `block-${2 * i}-d`, text: '÷' }
        });
        
        let f2Blocks = JSON.parse(JSON.stringify(stepBlocks));
        f2Blocks.forEach((b, idx) => {
            let isOldI = (idx === 2 * i);
            let isNewI = (idx === 2 * fractions.length + 2 * i);
            if (isOldI) {
                b.hl = ['n', 'd']; b.dim = ['line'];
                b.circle = ['n', 'd'];
            } else if (isNewI) {
                b.hl = ['d']; b.dim = ['n', 'line'];
                b.circle = ['d'];
            } else {
                b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
            }
        });
        animFrames.push({ 
            txtId: `a-txt-2-s${i}`, 
            blocks: f2Blocks,
            connector: { from: `block-${2 * i}-d`, to: `block-${2 * i}-n`, text: '×' }
        });
        
        let f3Blocks = JSON.parse(JSON.stringify(stepBlocks));
        f3Blocks.forEach((b, idx) => {
            let isNewI = (idx === 2 * fractions.length + 2 * i);
            if (isNewI) {
                b.hl = ['n', 'd', 'line']; b.dim = [];
                b.circle = ['frac'];
            } else {
                b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
            }
        });
        animFrames.push({ 
            txtId: `a-txt-3-s${i}`, 
            blocks: f3Blocks,
            connector: { from: `block-${2 * i}-n`, to: `block-${2 * fractions.length + 2 * i}-n`, text: `➔ Scrivi ${newNums[i]}` }
        });
        
        steps.push({
            description: `<span id="a-txt-0-s${i}" class="anim-text"><strong>Passaggio ${mcmDetailedSteps.length + 2 + i}:</strong> Trasformiamo la frazione numero ${i + 1}.</span><br>` +
                         `<span id="a-txt-1-s${i}" class="anim-text">Dividiamo il nuovo denominatore (${mcm}) per quello vecchio (${fractions[i].den})</span> ` +
                         `<span id="a-txt-2-s${i}" class="anim-text">e moltiplichiamo per il numeratore (${fractions[i].num}).</span><br>` +
                         `<span id="a-txt-3-s${i}" class="anim-text">(${mcm} ÷ ${fractions[i].den}) × ${fractions[i].num} = <strong>${newNums[i]}</strong>.</span>`,
            blocks: stepBlocks,
            animation: animFrames
        });
    }
    
    // --- Passaggio N+2: Somma dei numeratori ---
    // Mostra solo le frazioni convertite con denominatore comune e il risultato
    let stepCombineBlocks = [];
    newNums.forEach((n, idx) => {
        if (idx > 0) {
            const currentOp = ops[idx - 1] === '*' ? '×' : (ops[idx - 1] === '/' ? '÷' : ops[idx - 1]);
            stepCombineBlocks.push({ type: 'op', val: currentOp, hl: ['val'] });
        }
        stepCombineBlocks.push({ type: 'frac', n: n, d: mcm, hl: ['n'], dim: ['d', 'line'] });
    });
    stepCombineBlocks.push({ type: 'op', val: '=', dim: ['val'] });
    stepCombineBlocks.push({ type: 'frac', n: res_n, d: mcm, hl: ['n'], dim: ['d', 'line'] });
    
    let calcStr = newNums[0].toString();
    for (let i = 1; i < newNums.length; i++) {
        const currentOp = ops[i - 1] === '*' ? '×' : (ops[i - 1] === '/' ? '÷' : ops[i - 1]);
        calcStr += ` ${currentOp} ${newNums[i]}`;
    }
    
    let animCombineFrames = [];
    let fc0 = JSON.parse(JSON.stringify(stepCombineBlocks));
    fc0.forEach((b, idx) => {
        let isConvertedFrac = (idx < stepCombineBlocks.length - 2 && idx % 2 === 0);
        if (isConvertedFrac) {
            b.hl = ['n']; b.dim = ['d', 'line'];
            b.circle = ['n'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animCombineFrames.push({ txtId: 'ac-txt-0', blocks: fc0 });
    
    let fc1 = JSON.parse(JSON.stringify(stepCombineBlocks));
    fc1.forEach((b, idx) => {
        let isConvertedFrac = (idx < stepCombineBlocks.length - 2 && idx % 2 === 0);
        let isConvertedOp = (idx < stepCombineBlocks.length - 2 && idx % 2 !== 0);
        if (isConvertedFrac) {
            b.hl = ['n']; b.dim = ['d', 'line'];
            b.circle = ['n'];
        } else if (isConvertedOp) {
            b.hl = ['val']; b.dim = [];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animCombineFrames.push({ txtId: 'ac-txt-1', blocks: fc1 });
    
    let fc2 = JSON.parse(JSON.stringify(stepCombineBlocks));
    fc2.forEach((b, idx) => {
        let isFinalFrac = (idx === stepCombineBlocks.length - 1);
        if (isFinalFrac) {
            b.hl = ['n', 'd', 'line']; b.dim = [];
            b.circle = ['n'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animCombineFrames.push({ 
        txtId: 'ac-txt-2', 
        blocks: fc2,
        connector: { from: `block-${stepCombineBlocks.length - 3}-n`, to: `block-${stepCombineBlocks.length - 1}-n`, text: '=' }
    });
    
    steps.push({
        description: `<span id="ac-txt-0" class="anim-text"><strong>Passaggio ${mcmDetailedSteps.length + fractions.length + 2}:</strong> Ora che tutte le frazioni hanno lo stesso denominatore, possiamo combinare i numeratori...</span><br>` +
                     `<span id="ac-txt-1" class="anim-text">calcolando: ${calcStr}</span> ` +
                     `<span id="ac-txt-2" class="anim-text">= <strong>${res_n}</strong> mantenendo lo stesso denominatore.</span>`,
        blocks: stepCombineBlocks,
        animation: animCombineFrames
    });
    
    // --- Passaggio N+3: Risultato finale ---
    let stepFinalBlocks = [];
    fractions.forEach((f, idx) => {
        if (idx > 0) {
            const currentOp = ops[idx - 1] === '*' ? '×' : (ops[idx - 1] === '/' ? '÷' : ops[idx - 1]);
            stepFinalBlocks.push({ type: 'op', val: currentOp, dim: [] });
        }
        stepFinalBlocks.push({ type: 'frac', n: f.num, d: f.den, dim: [] });
    });
    stepFinalBlocks.push({ type: 'op', val: '=', dim: [] });
    stepFinalBlocks.push({ type: 'frac', n: res_n, d: mcm, hl: ['n', 'd', 'line'], dim: [] });
    
    let animFinalFrames = [];
    let ff0_blocks = JSON.parse(JSON.stringify(stepFinalBlocks));
    ff0_blocks.forEach((b, idx) => {
        if (idx < 2*fractions.length - 1) {
            b.hl = ['n', 'd', 'line']; b.dim = [];
            if (b.type === 'frac') b.circle = ['frac'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animFinalFrames.push({ txtId: 'af-txt-0', blocks: ff0_blocks });
    
    let ff1_blocks = JSON.parse(JSON.stringify(stepFinalBlocks));
    ff1_blocks.forEach((b, idx) => {
        if (idx === stepFinalBlocks.length - 1) {
            b.hl = ['n', 'd', 'line']; b.dim = [];
            b.circle = ['frac'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animFinalFrames.push({ 
        txtId: 'af-txt-1', 
        blocks: ff1_blocks,
        connector: { from: 'block-0', to: `block-${stepFinalBlocks.length - 1}`, text: '=' }
    });
    
    steps.push({
        description: `<span id="af-txt-0" class="anim-text"><strong>Finito!</strong> L'operazione è completa.</span><br>` +
                     `<span id="af-txt-1" class="anim-text">Il risultato finale è <strong>${res_n}/${mcm}</strong>.</span>`,
        blocks: stepFinalBlocks,
        animation: animFinalFrames
    });
    
    return steps;
}

function buildStepsMultiplicative(fractions, ops) {
    // Salva l'operazione originale per mostrarla nell'header
    originalOperationStr = buildOperationHeader(fractions, ops);
    
    let transformed = fractions.map((f, idx) => {
        if (idx === 0) return { num: f.num, den: f.den };
        const prevOp = ops[idx - 1];
        if (prevOp === '/') {
            return { num: f.den, den: f.num };
        } else {
            return { num: f.num, den: f.den };
        }
    });
    
    let res_n = transformed.reduce((acc, f) => acc * f.num, 1);
    let res_d = transformed.reduce((acc, f) => acc * f.den, 1);
    
    let steps = [];
    
    const hasDiv = ops.includes('/');
    if (hasDiv) {
        let step1Blocks = [];
        fractions.forEach((f, idx) => {
            if (idx > 0) {
                const currentOp = ops[idx - 1] === '/' ? '÷' : '×';
                step1Blocks.push({ type: 'op', val: currentOp, hl: ['val'] });
            }
            if (idx > 0 && ops[idx - 1] === '/') {
                step1Blocks.push({ 
                    type: 'frac', 
                    n: f.num + ' <span class="arrow-red">↳</span>', 
                    d: f.den + ' <span class="arrow-red">↗</span>', 
                    hl: ['n', 'd'], 
                    dim: ['line'] 
                });
            } else {
                step1Blocks.push({ type: 'frac', n: f.num, d: f.den, dim: [] });
            }
        });
        step1Blocks.push({ type: 'op', val: '→', hl: ['val'] });
        transformed.forEach((f, idx) => {
            if (idx > 0) {
                step1Blocks.push({ type: 'op', val: '×', hl: ['val'] });
            }
            if (idx > 0 && ops[idx - 1] === '/') {
                step1Blocks.push({ 
                    type: 'frac', 
                    n: '<span class="arrow-red">↗</span> ' + f.num, 
                    d: '<span class="arrow-red">↳</span> ' + f.den, 
                    hl: ['n', 'd'], 
                    dim: ['line'] 
                });
            } else {
                step1Blocks.push({ type: 'frac', n: f.num, d: f.den, dim: [] });
            }
        });
        
        let animDiv1 = [];
        let d1_0 = JSON.parse(JSON.stringify(step1Blocks));
        d1_0.forEach((b, idx) => {
            if (idx >= 2*fractions.length && idx < step1Blocks.length) {
                b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
            } else {
                let isDiv = false;
                if (b.type === 'frac') {
                    const fracIdx = idx / 2;
                    isDiv = fracIdx > 0 && ops[fracIdx - 1] === '/';
                } else {
                    const opIdx = (idx - 1) / 2;
                    isDiv = ops[opIdx] === '/';
                }
                if (isDiv) {
                    b.hl = b.type === 'frac' ? ['n', 'd'] : ['val'];
                    if (b.type === 'frac') b.circle = ['frac'];
                } else {
                    b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
                }
            }
        });
        animDiv1.push({ txtId: 'd1-txt-0', blocks: d1_0 });
        
        let d1_1 = JSON.parse(JSON.stringify(step1Blocks));
        d1_1.forEach((b, idx) => {
            if (idx < 2*fractions.length) {
                if (b.type === 'frac') {
                    const fracIdx = idx / 2;
                    if (fracIdx > 0 && ops[fracIdx - 1] === '/') b.circle = ['frac'];
                }
            } else if (idx >= 2*fractions.length) {
                const relIdx = idx - 2*fractions.length;
                if (b.type === 'frac') {
                    const fracIdx = relIdx / 2;
                    if (fracIdx > 0 && ops[fracIdx - 1] === '/') b.circle = ['frac'];
                }
            }
        });
        const firstDivIdx = ops.indexOf('/');
        animDiv1.push({ 
            txtId: 'd1-txt-1', 
            blocks: d1_1,
            connector: { from: `block-${2*firstDivIdx + 2}`, to: `block-${2*fractions.length + 2*firstDivIdx + 2}`, text: 'Inverti ↻' }
        });
        
        let d1_2 = JSON.parse(JSON.stringify(step1Blocks));
        d1_2.forEach((b, idx) => {
            if (idx < 2*fractions.length) {
                b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
            } else {
                b.hl = b.type === 'frac' ? ['n', 'd', 'line'] : ['val']; b.dim = [];
                if (b.type === 'frac') b.circle = ['frac'];
            }
        });
        animDiv1.push({ txtId: 'd1-txt-2', blocks: d1_2 });
        
        steps.push({
            description: `<span id="d1-txt-0" class="anim-text"><strong>Passaggio 1:</strong> Trasformiamo le divisioni (÷) in <strong>moltiplicazioni (×)</strong>.</span><br>` +
                         `<span id="d1-txt-1" class="anim-text">Per farlo, <strong>invertiamo</strong> il numeratore e il denominatore delle frazioni dopo il segno ÷.</span><br>` +
                         `<span id="d1-txt-2" class="anim-text">Le frecce rosse mostrano lo scambio. Le moltiplicazioni esistenti rimangono invariate.</span>`,
            blocks: step1Blocks,
            animation: animDiv1
        });
    }
    
    let mulSteps = buildStepsMulTransformed(transformed, hasDiv ? steps.length + 1 : 1);
    steps = steps.concat(mulSteps);
    
    let stepFinalBlocks = [];
    fractions.forEach((f, idx) => {
        if (idx > 0) {
            const currentOp = ops[idx - 1] === '/' ? '÷' : '×';
            stepFinalBlocks.push({ type: 'op', val: currentOp, dim: [] });
        }
        stepFinalBlocks.push({ type: 'frac', n: f.num, d: f.den, dim: [] });
    });
    stepFinalBlocks.push({ type: 'op', val: '=', dim: [] });
    stepFinalBlocks.push({ type: 'frac', n: res_n, d: res_d, hl: ['n', 'd', 'line'], dim: [] });
    
    let animFinal = [];
    let f0 = JSON.parse(JSON.stringify(stepFinalBlocks));
    f0.forEach((b, idx) => {
        if (idx < 2*fractions.length - 1) {
            b.hl = ['n', 'd', 'line']; b.dim = [];
            if (b.type === 'frac') b.circle = ['frac'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animFinal.push({ txtId: 'df-txt-0', blocks: f0 });
    
    let f1 = JSON.parse(JSON.stringify(stepFinalBlocks));
    f1.forEach((b, idx) => {
        if (idx === stepFinalBlocks.length - 1) {
            b.hl = ['n', 'd', 'line']; b.dim = [];
            b.circle = ['frac'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animFinal.push({ 
        txtId: 'df-txt-1', 
        blocks: f1,
        connector: { from: 'block-0', to: `block-${stepFinalBlocks.length - 1}`, text: '=' }
    });
    
    steps.push({
        description: `<span id="df-txt-0" class="anim-text"><strong>Finito!</strong> L'operazione è completa.</span><br>` +
                     `<span id="df-txt-1" class="anim-text">Il risultato finale è <strong>${res_n}/${res_d}</strong>.</span>`,
        blocks: stepFinalBlocks,
        animation: animFinal
    });
    
    return steps;
}

function buildStepsMulTransformed(fractions, startStepIdx) {
    let res_n = fractions.reduce((acc, f) => acc * f.num, 1);
    let res_d = fractions.reduce((acc, f) => acc * f.den, 1);
    
    let numsStr = fractions.map(f => f.num).join(' × ');
    let densStr = fractions.map(f => f.den).join(' × ');
    
    let step1Blocks = [];
    fractions.forEach((f, idx) => {
        if (idx > 0) step1Blocks.push({ type: 'op', val: '×', hl: ['val'] });
        step1Blocks.push({ type: 'frac', n: f.num, d: f.den, hl: ['n'], dim: ['d', 'line'] });
    });
    step1Blocks.push({ type: 'op', val: '=', dim: ['val'] });
    step1Blocks.push({ type: 'frac', n: res_n, d: '?', hl: ['n'], dim: ['d', 'line'] });
    
    let animMul1 = [];
    let m1_0 = JSON.parse(JSON.stringify(step1Blocks));
    m1_0.forEach((b, idx) => {
        if (idx < 2*fractions.length - 1) {
            if (b.type === 'frac') {
                b.hl = ['n']; b.dim = ['d', 'line'];
                b.circle = ['n'];
            } else if (b.type === 'op') {
                b.hl = ['val']; b.dim = [];
            }
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animMul1.push({ txtId: 'm1-txt-0', blocks: m1_0 });
    
    let m1_1 = JSON.parse(JSON.stringify(step1Blocks));
    m1_1.forEach((b, idx) => {
        if (idx === step1Blocks.length - 1) {
            b.hl = ['n']; b.dim = ['d', 'line'];
            b.circle = ['n'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animMul1.push({ 
        txtId: 'm1-txt-1', 
        blocks: m1_1,
        connector: { from: `block-${2*fractions.length - 2}-n`, to: `block-${step1Blocks.length - 1}-n`, text: '=' }
    });
    
    let step2Blocks = [];
    fractions.forEach((f, idx) => {
        if (idx > 0) step2Blocks.push({ type: 'op', val: '×', hl: ['val'] });
        step2Blocks.push({ type: 'frac', n: f.num, d: f.den, hl: ['d'], dim: ['n', 'line'] });
    });
    step2Blocks.push({ type: 'op', val: '=', dim: ['val'] });
    step2Blocks.push({ type: 'frac', n: res_n, d: res_d, hl: ['d'], dim: ['n', 'line'] });
    
    let animMul2 = [];
    let m2_0 = JSON.parse(JSON.stringify(step2Blocks));
    m2_0.forEach((b, idx) => {
        if (idx < 2*fractions.length - 1) {
            if (b.type === 'frac') {
                b.hl = ['d']; b.dim = ['n', 'line'];
                b.circle = ['d'];
            } else if (b.type === 'op') {
                b.hl = ['val']; b.dim = [];
            }
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animMul2.push({ txtId: 'm2-txt-0', blocks: m2_0 });
    
    let m2_1 = JSON.parse(JSON.stringify(step2Blocks));
    m2_1.forEach((b, idx) => {
        if (idx === step2Blocks.length - 1) {
            b.hl = ['d']; b.dim = ['n', 'line'];
            b.circle = ['d'];
        } else {
            b.hl = []; b.dim = b.type === 'frac' ? ['n', 'd', 'line'] : ['val'];
        }
    });
    animMul2.push({ 
        txtId: 'm2-txt-1', 
        blocks: m2_1,
        connector: { from: `block-${2*fractions.length - 2}-d`, to: `block-${step2Blocks.length - 1}-d`, text: '=' }
    });
    
    return [
        {
            description: `<span id="m1-txt-0" class="anim-text"><strong>Passaggio ${startStepIdx}:</strong> Moltiplichiamo tutti i numeratori delle frazioni:</span><br>` +
                         `<span id="m1-txt-1" class="anim-text">${numsStr} = <strong>${res_n}</strong>.</span>`,
            blocks: step1Blocks,
            animation: animMul1
        },
        {
            description: `<span id="m2-txt-0" class="anim-text"><strong>Passaggio ${startStepIdx + 1}:</strong> Moltiplichiamo tutti i denominatori delle frazioni:</span><br>` +
                         `<span id="m2-txt-1" class="anim-text">${densStr} = <strong>${res_d}</strong>.</span>`,
            blocks: step2Blocks,
            animation: animMul2
        }
    ];
}

// --- MOTORE VISUALE ---

// --- RAPPRESENTAZIONE VISIVA A TORTE (DSA SUPPORT) ---
let showPies = false;

function parseNumericValue(val) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const match = val.match(/-?\d+/);
        if (match) return parseInt(match[0], 10);
    }
    return NaN;
}

function drawSinglePieSVG(shaded, total) {
    const size = 35;
    const center = size / 2;
    const radius = size / 2 - 2;
    
    let paths = [];
    
    if (total === 1) {
        const fill = shaded >= 1 ? 'var(--primary-blue)' : '#E5E5E5';
        paths.push(`<circle cx="${center}" cy="${center}" r="${radius}" fill="${fill}" stroke="#FFFFFF" stroke-width="4"/>`);
    } else if (total > 100) {
        paths.push(`<circle cx="${center}" cy="${center}" r="${radius}" fill="#E5E5E5" stroke="#FFFFFF" stroke-width="4"/>`);
        
        if (shaded >= total) {
            paths.push(`<circle cx="${center}" cy="${center}" r="${radius}" fill="var(--primary-blue)" stroke="#FFFFFF" stroke-width="4"/>`);
        } else if (shaded > 0) {
            const angleStart = -Math.PI / 2;
            const angleEnd = angleStart + (shaded / total) * 2 * Math.PI;
            
            const x1 = center + radius * Math.cos(angleStart);
            const y1 = center + radius * Math.sin(angleStart);
            const x2 = center + radius * Math.cos(angleEnd);
            const y2 = center + radius * Math.sin(angleEnd);
            
            const largeArcFlag = (shaded / total) > 0.5 ? 1 : 0;
            
            paths.push(`<path d="M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="var(--primary-blue)" stroke="#FFFFFF" stroke-width="3"/>`);
        }
    } else {
        for (let k = 0; k < total; k++) {
            const angleStart = (k * 2 * Math.PI) / total - Math.PI / 2;
            const angleEnd = ((k + 1) * 2 * Math.PI) / total - Math.PI / 2;
            
            const x1 = center + radius * Math.cos(angleStart);
            const y1 = center + radius * Math.sin(angleStart);
            const x2 = center + radius * Math.cos(angleEnd);
            const y2 = center + radius * Math.sin(angleEnd);
            
            const fill = k < shaded ? 'var(--primary-blue)' : '#E5E5E5';
            
            paths.push(`<path d="M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z" fill="${fill}" stroke="#FFFFFF" stroke-width="2"/>`);
        }
    }
    
    return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.15)); margin: 0;">
            ${paths.join('')}
        </svg>
    `;
}

function getPieSVGHTML(num, den) {
    if (isNaN(num) || isNaN(den) || den <= 0) return '';
    
    const absNum = Math.abs(num);
    const absDen = Math.abs(den);
    
    const fullPiesCount = Math.floor(absNum / absDen);
    const remainderShaded = absNum % absDen;
    const needsRemainderPie = remainderShaded > 0 || fullPiesCount === 0;
    
    let html = '<div class="pies-row" style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; width: 100%;">';
    
    for (let i = 0; i < fullPiesCount; i++) {
        html += drawSinglePieSVG(absDen, absDen);
    }
    
    if (needsRemainderPie) {
        html += drawSinglePieSVG(remainderShaded, absDen);
    }
    
    html += '</div>';
    return html;
}

function updatePiesRendering(blocks) {
    blocks.forEach((b, i) => {
        if (b.type === 'frac') {
            const fracEl = document.getElementById(`block-${i}`);
            if (!fracEl) return;
            
            let pieContainer = document.getElementById(`block-${i}-pie`);
            if (!pieContainer) {
                pieContainer = document.createElement('div');
                pieContainer.id = `block-${i}-pie`;
                pieContainer.className = 'fraction-pie-container';
                fracEl.appendChild(pieContainer);
            }
            
            const parsedN = parseNumericValue(b.n);
            const parsedD = parseNumericValue(b.d);
            
            if (showPies && !isNaN(parsedD) && parsedD > 0) {
                if (!isNaN(parsedN)) {
                    pieContainer.innerHTML = getPieSVGHTML(parsedN, parsedD);
                } else {
                    pieContainer.innerHTML = drawSinglePieSVG(0, parsedD);
                }
                pieContainer.style.display = 'block';
                pieContainer.style.opacity = '1';
            } else {
                pieContainer.innerHTML = '';
                pieContainer.style.display = 'none';
                pieContainer.style.opacity = '0';
            }
        }
    });
}

function renderBoardStructure(blocks) {
    const board = document.getElementById('step-visual');
    // Pulisce completamente il board per evitare residui di step precedenti
    board.innerHTML = '';
    
    blocks.forEach((b, i) => {
        const temp = document.createElement('div');
        if (b.type === 'frac') {
            temp.innerHTML = `
                <div class="fraction-display" id="block-${i}">
                    <div class="num fade-target" id="block-${i}-n"></div>
                    <div class="line fade-target" id="block-${i}-line"></div>
                    <div class="den fade-target" id="block-${i}-d"></div>
                </div>
            `;
        } else {
            temp.innerHTML = `<div class="op-display fade-target" id="block-${i}"></div>`;
        }
        const el = temp.firstElementChild;
        board.appendChild(el);
        
        if (b.type === 'frac') {
            document.getElementById(`block-${i}-n`).innerHTML = b.n;
            document.getElementById(`block-${i}-d`).innerHTML = b.d;
        } else {
            el.innerHTML = b.val;
        }
    });
    
    updatePiesRendering(blocks);
}

function applyStyles(blocks) {
    blocks.forEach((b, i) => {
        if (b.type === 'frac') {
            const frac = document.getElementById(`block-${i}`);
            const n = document.getElementById(`block-${i}-n`);
            const d = document.getElementById(`block-${i}-d`);
            const line = document.getElementById(`block-${i}-line`);
            
            frac.classList.remove('circled');
            n.classList.remove('highlight-red', 'highlight-blue', 'dimmed', 'circled');
            d.classList.remove('highlight-red', 'highlight-blue', 'dimmed', 'circled');
            line.classList.remove('highlight-red', 'highlight-blue', 'dimmed');

            if (b.hl && b.hl.includes('n')) n.classList.add('highlight-red');
            if (b.hl && b.hl.includes('d')) d.classList.add('highlight-red');
            if (b.hl && b.hl.includes('line')) line.classList.add('highlight-red');

            if (b.hl_blue && b.hl_blue.includes('n')) n.classList.add('highlight-blue');
            if (b.hl_blue && b.hl_blue.includes('d')) d.classList.add('highlight-blue');
            if (b.hl_blue && b.hl_blue.includes('line')) line.classList.add('highlight-blue');

            if (b.dim && b.dim.includes('n')) n.classList.add('dimmed');
            if (b.dim && b.dim.includes('d')) d.classList.add('dimmed');
            if (b.dim && b.dim.includes('line')) line.classList.add('dimmed');
            
            if (b.circle && b.circle.includes('frac')) frac.classList.add('circled');
            if (b.circle && b.circle.includes('n')) n.classList.add('circled');
            if (b.circle && b.circle.includes('d')) d.classList.add('circled');
        } else {
            const val = document.getElementById(`block-${i}`);
            if (val) {
                val.classList.remove('highlight-red', 'highlight-blue', 'dimmed');
                if (b.hl && b.hl.includes('val')) val.classList.add('highlight-red');
                if (b.hl_blue && b.hl_blue.includes('val')) val.classList.add('highlight-blue');
                if (b.dim && b.dim.includes('val')) val.classList.add('dimmed');
            }
        }
    });
    
    updatePiesRendering(blocks);
}

function stopAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    isAnimating = false;
    renderedFrameIndex = -1;
    const btnPlay = document.getElementById('btn-play-animation');
    if (btnPlay) {
        btnPlay.innerHTML = '▶ Avvia';
        btnPlay.classList.remove('active');
    }
    
    const step = currentSteps[currentStepIndex];
    if (step) {
        renderBoardStructure(step.blocks);
        applyStyles(step.blocks);
    }
    document.querySelectorAll('.anim-text').forEach(el => el.classList.remove('active-text'));
    clearVisualConnectors();
}

function startAnimation(step) {
    if (!step.animation || step.animation.length === 0) return;
    
    isAnimating = true;
    const btnPlay = document.getElementById('btn-play-animation');
    if (btnPlay) {
        btnPlay.innerHTML = '⏸ Pausa';
        btnPlay.classList.add('active');
    }
    
    currentAnimFrame = 0;
    
    function playFrame() {
        const frame = step.animation[currentAnimFrame];
        
        renderBoardStructure(frame.blocks);
        applyStyles(frame.blocks);
        
        document.querySelectorAll('.anim-text').forEach(el => el.classList.remove('active-text'));
        const activeText = document.getElementById(frame.txtId);
        if (activeText) {
            activeText.classList.add('active-text');
        }
        
        clearVisualConnectors();
        if (frame.connector) {
            if (Array.isArray(frame.connector)) {
                frame.connector.forEach(conn => {
                    drawVisualConnector(conn.from, conn.to, conn.text);
                });
            } else {
                drawVisualConnector(frame.connector.from, frame.connector.to, frame.connector.text);
            }
        }
        
        renderedFrameIndex = currentAnimFrame;
        currentAnimFrame = (currentAnimFrame + 1) % step.animation.length;
    }
    
    playFrame();
    animationInterval = setInterval(playFrame, 3500);
}

function buildInlineFractionHTML(fractions, ops) {
    let html = '';
    fractions.forEach((f, idx) => {
        if (idx > 0) {
            const sym = ops[idx - 1] === '*' ? '×' : (ops[idx - 1] === '/' ? '÷' : ops[idx - 1]);
            html += `<span style="margin: 0 4px; font-size: 1rem; font-weight: bold; color: var(--primary-blue);">${sym}</span>`;
        }
        html += `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 2px; line-height: 1;">
            <span style="padding: 0 4px; font-size: 0.9rem;">${f.num}</span>
            <span style="width: 100%; height: 3px; background: var(--text-color); border-radius: 2px; margin: 1px 0;"></span>
            <span style="padding: 0 4px; font-size: 0.9rem;">${f.den}</span>
        </span>`;
    });
    return html;
}

function toggleAnimation() {
    const step = currentSteps[currentStepIndex];
    if (!step) return;
    
    if (isAnimating) {
        stopAnimation();
    } else {
        startAnimation(step);
    }
}

function updateOriginalOpHeader() {
    const headerEl = document.getElementById('original-op-header');
    if (headerEl) {
        if (originalFractions.length > 0) {
            headerEl.innerHTML = '<span style="font-weight: bold; margin-right: 4px;">Operazione:</span> ' + buildInlineFractionHTML(originalFractions, originalOps);
            headerEl.style.display = 'block';
        } else {
            headerEl.style.display = 'none';
        }
    }
}

function showStep(index) {
    stopAnimation();
    
    const step = currentSteps[index];
    renderBoardStructure(step.blocks);
    
    // Mostra l'operazione originale nell'header
    updateOriginalOpHeader();
    
    const descEl = document.getElementById('step-description');
    descEl.style.opacity = 0;
    
    setTimeout(() => {
        descEl.innerHTML = step.description;
        descEl.style.opacity = 1;
        
        const isLastOriginalStep = (index === currentSteps.length - 1) && !step.isSimplification;
        if (isLastOriginalStep) {
            const finalBlock = step.blocks[step.blocks.length - 1];
            if (finalBlock && finalBlock.type === 'frac') {
                const n = parseInt(finalBlock.n);
                const d = parseInt(finalBlock.d);
                if (!isNaN(n) && !isNaN(d) && d > 0) {
                    const g = gcd(n, d);
                    if (g > 1) {
                        descEl.innerHTML += 
                            `<br><button id="btn-simplify-res" class="control-btn-accent" style="margin-top: 15px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; font-size: 1rem; border: none; cursor: pointer; background: var(--accent-red); color: white; box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3); transition: transform 0.2s ease, opacity 0.2s ease;">✨ Semplifica Risultato (MCD: ${g})</button>`;
                        
                        setTimeout(() => {
                            const btnSimp = document.getElementById('btn-simplify-res');
                            if (btnSimp) {
                                btnSimp.addEventListener('click', () => {
                                    simplifyFinalFraction(n, d, g);
                                });
                            }
                        }, 50);
                    }
                }
            }
        }
    }, 400);

    setTimeout(() => {
        applyStyles(step.blocks);
        if (step.connector) {
            clearVisualConnectors();
            if (Array.isArray(step.connector)) {
                step.connector.forEach(conn => {
                    drawVisualConnector(conn.from, conn.to, conn.text);
                });
            } else {
                drawVisualConnector(step.connector.from, step.connector.to, step.connector.text);
            }
        }
    }, 50);

    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    const btnPlay = document.getElementById('btn-play-animation');
    const btnPrevFrame = document.getElementById('btn-prev-frame');
    const btnNextFrame = document.getElementById('btn-next-frame');
    
    btnPrev.disabled = (index === 0);
    btnNext.disabled = (index === currentSteps.length - 1);
    
    const hasAnim = !!(step.animation && step.animation.length > 0);
    btnPlay.disabled = !hasAnim;
    btnPrevFrame.disabled = !hasAnim;
    btnNextFrame.disabled = !hasAnim;
    
    if (!hasAnim) {
        btnPlay.innerHTML = '▶ Avvia';
        btnPlay.classList.remove('active');
    }
}

function simplifyFinalFraction(n, d, g) {
    const simpN = n / g;
    const simpD = d / g;
    
    let stepSimpBlocks = [];
    stepSimpBlocks.push({ type: 'frac', n: n, d: d, hl: ['n', 'd'], dim: [] });
    stepSimpBlocks.push({ type: 'op', val: '=', dim: [] });
    stepSimpBlocks.push({ type: 'frac', n: simpN, d: simpD, hl: ['n', 'd'], dim: [] });
    
    let animSimp = [];
    let s0 = JSON.parse(JSON.stringify(stepSimpBlocks));
    s0[2].hl = []; s0[2].dim = ['n', 'd', 'line'];
    s0[0].circle = ['frac'];
    animSimp.push({ txtId: 'simp-txt-0', blocks: s0 });
    
    let s1 = JSON.parse(JSON.stringify(stepSimpBlocks));
    s1[2].circle = ['frac'];
    animSimp.push({ 
        txtId: 'simp-txt-1', 
        blocks: s1, 
        connector: [
            { from: 'block-0-n', to: 'block-2-n', text: `÷ ${g}` },
            { from: 'block-0-d', to: 'block-2-d', text: `÷ ${g}` }
        ]
    });
    
    const simpStep = {
        isSimplification: true,
        description: `<span id="simp-txt-0" class="anim-text"><strong>Semplificazione:</strong> Dividiamo per il Massimo Comun Divisore (MCD) di ${n} e ${d}, che è <strong>${g}</strong>.</span><br>` +
                     `<span id="simp-txt-1" class="anim-text">Dividiamo sia il numeratore che il denominatore per ${g} per ottenere la frazione ridotta ai minimi termini: <strong>${simpN}/${simpD}</strong>.</span>`,
        blocks: stepSimpBlocks,
        animation: animSimp,
        connector: [
            { from: 'block-0-n', to: 'block-2-n', text: `÷ ${g}` },
            { from: 'block-0-d', to: 'block-2-d', text: `÷ ${g}` }
        ]
    };
    
    if (currentSteps.length > 0 && currentSteps[currentSteps.length - 1].isSimplification) {
        currentSteps.pop();
    }
    
    currentSteps.push(simpStep);
    currentStepIndex = currentSteps.length - 1;
    showStep(currentStepIndex);
}

// --- BOTTONI E UI EVENTI ---

function updateGlobalOpHighlight() {
    if (selectedOps.length === 0) return;
    const firstOp = selectedOps[0];
    const allSame = selectedOps.every(op => op === firstOp);
    
    document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('selected'));
    if (allSame) {
        selectedOp = firstOp;
        const matchBtn = document.querySelector(`.op-btn[data-op="${firstOp}"]`);
        if (matchBtn) matchBtn.classList.add('selected');
    } else {
        selectedOp = null;
    }
}

document.querySelectorAll('.op-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedOp = e.target.getAttribute('data-op');
        
        for (let i = 0; i < selectedOps.length; i++) {
            selectedOps[i] = selectedOp;
            let opSymbol = selectedOp;
            if (opSymbol === '*') opSymbol = '×';
            else if (opSymbol === '/') opSymbol = '÷';
            const valEl = document.getElementById(`op-val-${i}`);
            if (valEl) valEl.textContent = opSymbol;
        }
    });
});

document.getElementById('fractions-row').addEventListener('click', (e) => {
    const btn = e.target.closest('.op-arr-btn');
    if (!btn) return;
    
    const index = parseInt(btn.getAttribute('data-index'), 10);
    const isUp = btn.classList.contains('up');
    
    const ops = ['+', '-', '*', '/'];
    let currentIdx = ops.indexOf(selectedOps[index]);
    if (currentIdx === -1) currentIdx = 0;
    
    if (isUp) {
        currentIdx = (currentIdx - 1 + ops.length) % ops.length;
    } else {
        currentIdx = (currentIdx + 1) % ops.length;
    }
    
    selectedOps[index] = ops[currentIdx];
    
    let opSymbol = selectedOps[index];
    if (opSymbol === '*') opSymbol = '×';
    else if (opSymbol === '/') opSymbol = '÷';
    
    const valEl = document.getElementById(`op-val-${index}`);
    if (valEl) valEl.textContent = opSymbol;
    
    updateGlobalOpHighlight();
});

document.getElementById('btn-add-fraction').addEventListener('click', () => {
    if (fractionCount < 4) {
        const vals = getAndSaveValues();
        fractionCount++;
        renderInputs();
        restoreValues(vals);
    }
});

document.getElementById('btn-remove-fraction').addEventListener('click', () => {
    if (fractionCount > 2) {
        const vals = getAndSaveValues();
        fractionCount--;
        if (selectedOps.length > fractionCount - 1) {
            selectedOps.pop();
        }
        renderInputs();
        restoreValues(vals);
    }
});

document.getElementById('btn-analyze').addEventListener('click', () => {
    let fractions = [];
    for (let i = 1; i <= fractionCount; i++) {
        const numVal = parseInt(document.getElementById(`num${i}`).value, 10);
        const denVal = parseInt(document.getElementById(`den${i}`).value, 10);
        
        if (isNaN(numVal) || isNaN(denVal)) {
            alert("Per favore, inserisci tutti i numeri.");
            return;
        }
        if (denVal === 0) {
            alert("Un denominatore non può essere zero.");
            return;
        }
        fractions.push({ num: numVal, den: denVal });
    }

    const containsAddSub = selectedOps.some(op => op === '+' || op === '-');
    const containsMulDiv = selectedOps.some(op => op === '*' || op === '/');
    
    if (containsAddSub && containsMulDiv) {
        alert("matExplico al momento supporta espressioni contenenti solo addizioni e sottrazioni (+, -) oppure solo moltiplicazioni e divisioni (×, ÷) insieme. Evita di combinare operatori di tipo diverso.");
        return;
    }

    // Salva le frazioni e gli operatori originali per l'header "Operazione:" nella fase 3
    originalFractions = fractions.map(f => ({...f}));
    originalOps = [...selectedOps];

    let analysisHtml = '';
    fractions.forEach((f, idx) => {
        let label = '';
        if (idx === 0) label = 'prima frazione';
        else if (idx === 1) label = 'seconda frazione';
        else if (idx === 2) label = 'terza frazione';
        else if (idx === 3) label = 'quarta frazione';
        
        analysisHtml += `<div class="analysis-item">${getFractionDescription(f.num, f.den, label)}</div>`;
    });
    document.getElementById('analysis-content').innerHTML = analysisHtml;

    if (containsAddSub) {
        currentSteps = buildStepsAddSub(fractions, selectedOps);
    } else {
        currentSteps = buildStepsMultiplicative(fractions, selectedOps);
    }

    document.getElementById('phase1').classList.remove('active');
    setTimeout(() => {
        document.getElementById('phase2').classList.add('active');
    }, 600);
});

document.getElementById('btn-start-calc').addEventListener('click', () => {
    document.getElementById('phase2').classList.remove('active');
    setTimeout(() => {
        document.getElementById('phase3').classList.add('active');
        currentStepIndex = 0;
        document.getElementById('step-visual').innerHTML = '';
        showStep(currentStepIndex);
    }, 600);
});

document.getElementById('btn-prev-step').addEventListener('click', () => {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        showStep(currentStepIndex);
    }
});

document.getElementById('btn-next-step').addEventListener('click', () => {
    if (currentStepIndex < currentSteps.length - 1) {
        currentStepIndex++;
        showStep(currentStepIndex);
    }
});

function stepAnimationFrame(dir) {
    const step = currentSteps[currentStepIndex];
    if (!step.animation || step.animation.length === 0) return;
    
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    isAnimating = false;
    const btnPlay = document.getElementById('btn-play-animation');
    if (btnPlay) {
        btnPlay.innerHTML = '▶ Avvia';
        btnPlay.classList.remove('active');
    }
    
    if (renderedFrameIndex === -1) {
        renderedFrameIndex = 0;
    }
    
    if (dir === 'next') {
        renderedFrameIndex = (renderedFrameIndex + 1) % step.animation.length;
    } else {
        renderedFrameIndex = (renderedFrameIndex - 1 + step.animation.length) % step.animation.length;
    }
    
    currentAnimFrame = (renderedFrameIndex + 1) % step.animation.length;
    
    const frame = step.animation[renderedFrameIndex];
    renderBoardStructure(frame.blocks);
    applyStyles(frame.blocks);
    
    document.querySelectorAll('.anim-text').forEach(el => el.classList.remove('active-text'));
    const activeText = document.getElementById(frame.txtId);
    if (activeText) {
        activeText.classList.add('active-text');
    }
    
    clearVisualConnectors();
    if (frame.connector) {
        if (Array.isArray(frame.connector)) {
            frame.connector.forEach(conn => {
                drawVisualConnector(conn.from, conn.to, conn.text);
            });
        } else {
            drawVisualConnector(frame.connector.from, frame.connector.to, frame.connector.text);
        }
    }
}

document.getElementById('btn-prev-frame').addEventListener('click', () => {
    stepAnimationFrame('prev');
});

document.getElementById('btn-next-frame').addEventListener('click', () => {
    stepAnimationFrame('next');
});

document.getElementById('btn-play-animation').addEventListener('click', () => {
    toggleAnimation();
});

document.getElementById('btn-toggle-pies').addEventListener('click', (e) => {
    showPies = !showPies;
    if (showPies) {
        e.target.textContent = '📊 Nascondi Torte';
        e.target.classList.add('active');
    } else {
        e.target.textContent = '📊 Mostra Torte';
        e.target.classList.remove('active');
    }
    
    const step = currentSteps[currentStepIndex];
    if (step) {
        if (isAnimating && renderedFrameIndex !== -1) {
            const frame = step.animation[renderedFrameIndex];
            updatePiesRendering(frame.blocks);
        } else {
            updatePiesRendering(step.blocks);
        }
    }
});

document.getElementById('btn-new-calc').addEventListener('click', () => {
    document.getElementById('phase3').classList.remove('active');
    setTimeout(() => {
        document.getElementById('phase1').classList.add('active');
        fractionCount = 2;
        selectedOp = null;
        selectedOps = [];
        document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('selected'));
        showPies = false;
        const btnTogglePies = document.getElementById('btn-toggle-pies');
        if (btnTogglePies) {
            btnTogglePies.textContent = '📊 Mostra Torte';
            btnTogglePies.classList.remove('active');
        }
        renderInputs();
    }, 600);
});

// Inizializza gli input al caricamento della pagina
renderInputs();

// --- GESTIONE MODAL PER IMMAGINI INFORMATIVE ---
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalClose = document.getElementById('modal-close');
const modalOverlay = modal.querySelector('.modal-overlay');

function openImageModal(imgSrc, altText) {
    modalImg.src = imgSrc;
    modalImg.alt = altText;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    document.body.style.overflow = '';
}

document.getElementById('btn-show-mcd-mcm').addEventListener('click', () => {
    openImageModal('MCD-mcm.jpeg', 'Schema MCD e mcm');
});

document.getElementById('btn-show-frazioni').addEventListener('click', () => {
    openImageModal('imm-frazione.jpeg', 'Schema Frazioni');
});

modalClose.addEventListener('click', closeImageModal);
modalOverlay.addEventListener('click', closeImageModal);

// --- GESTIONE STAMPA PASSAGGI ---

function buildPrintFractionHTML(fractionsData) {
    let html = '';
    fractionsData.forEach((b) => {
        if (b.type === 'frac') {
            html += `<span class="frac">
                <span class="num">${b.n}</span>
                <span class="line"></span>
                <span class="den">${b.d}</span>
            </span>`;
        } else {
            html += `<span class="op">${b.val}</span>`;
        }
    });
    return html;
}

function getBlocksForPrint(step) {
    // Usa i blocchi base dello step
    return step.blocks || [];
}

function generatePrintView() {
    const container = document.getElementById('print-steps-container');
    if (!container) return;
    
    if (!currentSteps || currentSteps.length === 0) {
        container.innerHTML = '<p style="text-align:center;font-size:1.4rem;color:#999;">Nessun passaggio disponibile. Esegui prima un calcolo.</p>';
        return;
    }
    
    let html = '<div class="print-steps-grid">';
    
    currentSteps.forEach((step, idx) => {
        html += '<div class="print-step-card">';
        html += `<div class="print-step-number">Passaggio ${idx + 1}</div>`;
        
        const blocks = getBlocksForPrint(step);
        if (blocks && blocks.length > 0) {
            html += `<div class="print-step-visual">${buildPrintFractionHTML(blocks)}</div>`;
        }
        
        // Descrizione pulita (senza ID anim-text)
        let cleanDesc = step.description
            .replace(/<span[^>]*id="[^"]*"[^>]*class="anim-text"[^>]*>/g, '')
            .replace(/<\/span>/g, '')
            .replace(/<br\s*\/?>/g, ' ');
        
        html += `<div class="print-step-desc">${cleanDesc}</div>`;
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function openPrintModal() {
    generatePrintView();
    const modal = document.getElementById('print-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closePrintModal() {
    const modal = document.getElementById('print-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function printPDF() {
    // Genera il contenuto per la nuova finestra
    const stepsContainer = document.getElementById('print-steps-container');
    if (!stepsContainer) return;
    
    // Genera contenuto se non già presente
    if (!stepsContainer.querySelector('.print-steps-grid')) {
        generatePrintView();
    }
    
    const contentHTML = stepsContainer.innerHTML;
    
    // Crea una nuova finestra per la stampa
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
        alert('Per favore, permetti i popup per aprire la finestra di stampa.');
        return;
    }
    
    // Leggi lo stile dal documento corrente
    const styles = document.querySelectorAll('link[rel="stylesheet"], style');
    let styleHTML = '';
    styles.forEach(s => {
        if (s.tagName === 'LINK') {
            styleHTML += `<link rel="stylesheet" href="${s.href}">\n`;
        } else {
            styleHTML += s.outerHTML + '\n';
        }
    });
    
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Passaggi del Calcolo - matExplico</title>
    ${styleHTML}
    <style>
        body { 
            font-family: 'Andika', 'Comic Sans MS', sans-serif; 
            background: white; 
            padding: 20px 30px; 
            margin: 0;
            font-size: 14pt;
        }
        .print-steps-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .print-step-card {
            border: 2px solid #1976D2;
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .print-step-number {
            background: #1976D2;
            color: white;
            padding: 8px 14px;
            font-size: 1.1rem;
            font-weight: bold;
        }
        .print-step-visual {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px 10px;
            gap: 12px;
            font-size: 1.4rem;
            flex-wrap: nowrap;
        }
        .print-step-visual .frac {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            vertical-align: middle;
            margin: 0 3px;
        }
        .print-step-visual .frac .num {
            padding: 2px 8px;
            font-size: 1.3rem;
        }
        .print-step-visual .frac .line {
            width: 100%;
            height: 4px;
            background: #222;
            border-radius: 2px;
            margin: 2px 0;
        }
        .print-step-visual .frac .den {
            padding: 2px 8px;
            font-size: 1.3rem;
        }
        .print-step-visual .op {
            font-size: 1.4rem;
            font-weight: bold;
            color: #1976D2;
            margin: 0 3px;
        }
        .print-step-desc {
            padding: 10px 14px;
            background: #E3F2FD;
            font-size: 1rem;
            line-height: 1.4;
            border-top: 1px solid #BBDEFB;
        }
        .factorization-table, .factor-comparison-grid {
            font-size: 0.9rem;
            margin: 6px auto;
        }
        @media print {
            body { padding: 15px; font-size: 11pt; }
            .print-step-visual { padding: 10px 6px; font-size: 1.1rem; }
            .print-step-visual .frac .num, .print-step-visual .frac .den { font-size: 1rem; }
            .print-step-desc { font-size: 0.85rem; }
            .print-hint { display: none; }
            .print-step-card { border: 1px solid #1976D2; }
        }
    </style>
</head>
<body>
    ${contentHTML}
<script>
    window.onload = function() {
        setTimeout(function() { window.print(); }, 500);
    };
</script>
</body>
</html>
    `);
    printWindow.document.close();
}

document.getElementById('btn-print-steps').addEventListener('click', printPDF);
document.getElementById('btn-print-modal-close').addEventListener('click', closePrintModal);
document.getElementById('btn-print-pdf').addEventListener('click', function() {
    closePrintModal();
    setTimeout(printPDF, 300);
});

// Chiudi print-modal con clic sull'overlay
document.querySelector('.print-modal-overlay').addEventListener('click', closePrintModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeImageModal();
    }
    if (e.key === 'Escape') {
        const printModal = document.getElementById('print-modal');
        if (printModal && !printModal.classList.contains('hidden')) {
            closePrintModal();
        }
    }
});
