# Aviator Quant Bot — आसान हिंदी में समझें

यह एक Chrome Extension है जो Aviator game में **समझदारी से bet** लगाने में मदद करता है। यह भविष्य नहीं बताता — यह **discipline और risk management** करता है।

**सोचिए:** यह bot एक अनुभवी दुकानदार की तरह है जो जानता है कब stock खरीदना है, कितना खरीदना है, और कब दुकान बंद करनी है। वो भी guarantee नहीं दे सकता कि हर बार फायदा होगा — लेकिन वो अंधाधुंध नहीं खरीदता।

## Install कैसे करें

1. Chrome browser खोलें → address bar में `chrome://extensions/` टाइप करें
2. ऊपर दाईं तरफ **Developer mode** का toggle ON करें
3. **Load unpacked** बटन दबाएं → `aviator-strategy-bot` folder select करें
4. Aviator game वाली website खोलें
5. Extension icon click करें — एक panel दिखेगा

## मूल सिद्धांत (Core Philosophy)

**उदाहरण:** सोचिए आप मंडी में सब्जी बेचते हैं। आप रोज देखते हैं कि टमाटर का भाव कैसा रहा। अगर पिछले 50 दिनों में 35 दिन भाव ₹40 से ऊपर गया, तो आप समझ जाते हैं कि आज भी ₹40 से ऊपर जाने की अच्छी संभावना है। आप उसी हिसाब से खरीदारी करते हैं।

Bot भी यही करता है:
1. पिछले 50 rounds का data देखता है
2. हिसाब लगाता है — कितनी बार plane ऊपर गया
3. उसी हिसाब से bet size और cashout target तय करता है
4. अगर condition अच्छी नहीं है तो **bet ही नहीं लगाता** (यह सबसे ज़रूरी बात है)

## Algorithm कैसे काम करता है

### Module 1 — इतिहास देखना (Crash History)

**उदाहरण:** जैसे एक cricket analyst पिछले 50 गेंदों का record रखता है — कितनी boundary गईं, कितनी dot balls, batsman का strike rate क्या है।

Bot पिछले 50 rounds का record रखता है:
- **औसत (Mean)** — average crash कितना रहा
- **उतार-चढ़ाव (Volatility)** — results कितने अनियमित हैं
- **कितनी बार 1.5x, 2x, 3x से ऊपर गया** — success rate
- **लगातार कितनी बार नीचे रहा** — खतरे का signal

Bot पहले **10 rounds सिर्फ देखता है**, कोई bet नहीं लगाता। जैसे नया दुकानदार पहले market समझता है।

### Module 2 — कितना लगाएं (Kelly Criterion)

**उदाहरण:** सोचिए आपको पता है कि एक coin 60% बार heads आता है। तो आप सारा पैसा नहीं लगाएंगे — सिर्फ उतना लगाएंगे जितना आपकी "edge" (बढ़त) allow करती है। ज्यादा लगाओगे तो एक बुरे दिन में सब खत्म। कम लगाओगे तो फायदा कम।

Kelly Formula यही बताता है — **कितने % bankroll** की bet लगानी चाहिए:
- अगर जीतने की अच्छी संभावना है → ज्यादा bet (लेकिन max 5%)
- अगर संभावना कम है → छोटी bet
- अगर कोई edge नहीं दिखती → **bet ही मत करो** (skip)

Bot "Half-Kelly" use करता है — मतलब formula जो कहता है, उसका आधा ही लगाता है। जैसे समझदार आदमी पूरा risk नहीं लेता।

### Module 3 — कब Cash Out करें (Dynamic Target)

**उदाहरण:** मान लो train पकड़नी है। अगर platform पर भीड़ कम है (अच्छी condition), तो आप आराम से AC coach तक जाओगे। अगर भीड़ बहुत है (खराब condition), तो सबसे पहले जो डिब्बा मिले उसमें चढ़ जाओ। Bot भी ऐसे ही decide करता है:

| स्थिति | Target | सोच |
|---------|--------|------|
| 55%+ बार 2x से ऊपर गया | **2.0x** पर cash out | Session अच्छा चल रहा है |
| 55%+ बार 1.5x से ऊपर गया | **1.5x** पर cash out | Normal condition |
| 45%+ बार 1.5x से ऊपर गया | **1.3x** पर cash out | Condition ठीक नहीं — safe खेलो |
| 45% से कम | **Skip** | कोई edge नहीं — बैठो चुपचाप |

### Module 4 — तूफान में छाता (Volatility Guard)

**उदाहरण:** अगर मौसम बहुत बदल रहा है (कभी धूप, कभी आंधी) तो समझदार आदमी घर से बाहर कम निकलता है। जब मौसम stable हो, तब काम करता है।

| उतार-चढ़ाव | Level | Bot क्या करता है |
|------------|-------|-----------------|
| कम (< 1.5) | शांत | Normal bet |
| मध्यम (1.5–3.0) | हल्की हलचल | Bet 40% कम कर दो |
| ज्यादा (3.0–5.0) | तूफान | Bet 70% कम कर दो |
| बहुत ज्यादा (> 5.0) | आंधी | Bet मत करो, बैठो |

### Module 5 — Streak पहचानना

**उदाहरण:** अगर आप cricket में लगातार 4 गेंदों पर out हो रहे हैं, तो 5वीं गेंद पर और aggressive नहीं खेलोगे — defensive हो जाओगे। और अगर लगातार 4 छक्के मार रहे हैं, तो overconfident होकर अगली गेंद पर slog नहीं मारोगे।

| स्थिति | Bot का reaction |
|---------|----------------|
| लगातार 4 हार | Bet आधी कर दो |
| लगातार 6 हार | Bet बंद करो, देखो |
| लगातार 3 बार 1.5x से नीचे crash | Skip करो |
| लगातार 4 जीत | Normal रहो — bet बढ़ाओ मत |

**सबसे ज़रूरी नियम:** हारने के बाद bet DOUBLE कभी नहीं करना (Martingale नहीं)। यह सबसे तेज़ बर्बादी का रास्ता है।

### Module 6 — Final Decision

हर round से पहले bot सब modules को मिलाकर एक decision लेता है — जैसे एक judge सारी evidence देखकर फैसला सुनाता है:

1. History stats निकालो
2. Target decide करो
3. EV check करो (फायदे की संभावना > नुकसान?)
4. अगर EV negative → skip
5. Kelly formula से bet size निकालो
6. Volatility adjustment करो
7. Streak adjustment करो
8. Final check — minimum bet, maximum cap

अगर bot लगातार 3 rounds skip करता है, तो एक छोटी bet (1%) लगाता है सिर्फ data collect करने के लिए।

### Module 7 — रुकने के नियम (Stop Conditions)

**उदाहरण:** समझदार जुआरी कहता है — "आज ₹200 से ज्यादा नहीं हारूंगा, और ₹500 जीत गया तो उठ जाऊंगा।" Bot भी ऐसे ही rules follow करता है:

| नियम | Threshold | Action |
|------|-----------|--------|
| नुकसान (Drawdown) | Peak से 5% गिरा | Bot बंद |
| फायदा (Take-Profit) | 110% हो गया | Bot बंद |
| Maximum rounds | 100 rounds (बदल सकते हो) | Bot बंद |
| दिवालिया | ₹0 हो गया | Bot बंद |

---

## 9 Strategies — विस्तार से

### 1. Quant/Kelly (Default)

**उदाहरण:** एक professional share trader जो सिर्फ तभी खरीदता है जब उसे edge दिखती है, और उतना ही खरीदता है जितना उसकी edge allow करती है।

- हर round data देखकर decide करता है
- जब कोई edge नहीं → skip (bet ही नहीं)
- Bet को 2 हिस्सों में बांटता है: 70% safe target + 30% ऊंचे target पर

### 2. Goal Seeker (लक्ष्य खोजी)

**उदाहरण:** सोचिए आप पहाड़ पर चढ़ रहे हैं। जब चोटी के पास हों (goal करीब) तो धीरे-धीरे, सावधानी से चलोगे — गिरने का खतरा नहीं लेना। लेकिन अगर नीचे की तरफ फिसल रहे हो (बर्बादी के करीब) तो बड़ा कदम उठाना ही पड़ेगा वरना वैसे भी गिरोगे।

**5 ज़ोन:**

| ज़ोन | आपकी स्थिति | Bot क्या करेगा |
|------|-------------|---------------|
| TARGET (लक्ष्य) | Goal का 95%+ पहुंच गए | बहुत छोटी bet, 1.2x पर cash out — profit lock करो |
| COMFORT (आराम) | 70–95% goal तक | छोटी bet, 1.5x target — safe खेलो |
| NEUTRAL (बीच में) | 30–70% goal तक | Normal Kelly sizing |
| DANGER (खतरा) | सिर्फ 10–30% goal तक | बड़ी bet, ऊंचा target — aggressive |
| CRITICAL (संकट) | Stop-loss से 10% दूर | "करो या मरो" — बड़ा दांव, बड़ा target |

**कब use करें:** जब आपका clear goal हो (जैसे "₹1000 से ₹1100 बनाना है, ₹950 से नीचे जाऊं तो बंद")। Bot खुद aggression adjust करेगा।

### 3. Sniper (निशानेबाज़)

**उदाहरण:** सोचिए एक शिकारी जो घंटों झाड़ी में छुपकर शिकार देखता है। वो तब तक trigger नहीं दबाता जब तक perfect मौका न आए। 100 गोलियां बेकार नहीं चलाता — एक सही गोली चलाता है।

**कैसे काम करता है:**

```
1. 50 rounds चुपचाप देखो (observation)
      ↓
2. Analysis करो — कौन सा multiplier "hot" है
      ↓
3. Trigger condition check करो (optional waiting)
      ↓
4. FIRE — bet लगाओ
      ↓
5. हर bet के बाद फिर से 50 rounds देखो → फिर fire
      ↓
6. Window पूरी (hit या miss) → शुरू से restart
```

**Observation Phase (50 rounds):**
Bot 6 multiplier levels check करता है — 10x, 15x, 20x, 30x, 50x, 100x। देखता है कि कौन सा level "normal से ज्यादा" आ रहा है।

**Window Sizing (कितनी बार bet लगाएं):**

**उदाहरण:** मान लो target 15x है (हर round में 6.5% chance)। अगर आप 10 rounds लगातार bet करें, तो कम-से-कम 1 बार hit होने का 50% chance है।

| Confidence | कितनी बार bet | कुल खर्चा (₹10/bet) | कम-से-कम 1 hit का chance |
|------------|--------------|---------------------|--------------------------|
| 70% (सुरक्षित) | ~18 बार | ₹180 | 70% |
| 50% (बराबर) | ~10 बार | ₹100 | 50% |
| 30% (आक्रामक) | ~5 बार | ₹50 | 30% |

**Trade-off:** ज्यादा confidence = ज्यादा bets = hit होने का ज्यादा chance, लेकिन कुल खर्चा भी ज्यादा (profit margin कम)। कम confidence = कम bets = सस्ता, लेकिन ज्यादातर बार miss होगा (जब hit होगा तो बड़ा return)।

**Trigger Conditions (कब गोली चलाएं):**

| Trigger | शर्त | सोच |
|---------|------|------|
| Immediate (तुरंत) | Analysis होते ही अगले round में bet | Default — कोई इंतज़ार नहीं |
| Dry Spell (सूखा) | पिछले 5 rounds ALL 2x से नीचे | "सूखा पड़ा है, बारिश आने वाली है" |
| Overdue (बकाया) | Target पिछले 20 rounds में दिखा ही नहीं | "बहुत दिन हो गए, अब आएगा" |

**ईमानदार बात:** Dry Spell और Overdue triggers mathematically आपके chances IMPROVE नहीं करते। हर round independent है — game को याद नहीं कि पिछले round में क्या हुआ। लेकिन ये triggers **discipline** देते हैं — आप patience से wait करते हैं बजाय अंधाधुंध bet लगाने के।

**Settings:**

| Setting | Default | मतलब |
|---------|---------|-------|
| Observation Rounds | 50 | हर bet से पहले कितने round देखने हैं |
| Max Risk per Window | 5% | पूरी window में bankroll का max कितना % risk |
| Window Confidence | 50% | Window size कितनी बड़ी हो |
| Dynamic Target | On | हर bet से पहले target recalculate करो |
| Fire Trigger | Immediate | Trigger condition |

**कब use करें:** जब आप बड़े multiplier (10x, 15x, 20x+) पर निशाना लगाना चाहते हैं और patience रख सकते हैं।

### 4. Flat Conservative (सीधा-सादा सुरक्षित)

**उदाहरण:** FD (Fixed Deposit) — कम return लेकिन safe। हर round में bankroll का 1% लगाओ, 1.5x पर cash out करो। कभी बदलना नहीं। सबसे ज्यादा दिन टिकोगे।

### 5. Flat Balanced (सीधा-सादा संतुलित)

**उदाहरण:** Mutual Fund — थोड़ा ज्यादा risk, थोड़ा ज्यादा return। 1% bankroll, 2.0x target। कम बार जीतोगे लेकिन हर जीत पर ज्यादा मिलेगा।

### 6. Anti-Martingale (जीत पर बढ़ाओ)

**उदाहरण:** जैसे cricket में batsman form में है तो aggressive shots खेलता है, लेकिन out होते ही अगली बार defensive शुरू करता है।

- जीते → bet double करो (1x → 2x → 4x)
- हारे → base पर वापस आ जाओ
- 3 बार लगातार जीत गए → फिर भी reset (लालच मत करो)

### 7. 1-3-2-6 (सीढ़ी)

**उदाहरण:** जैसे सीढ़ी चढ़ रहे हो — 1 step, 3 step, 2 step, 6 step। अगर बीच में गिर गए (हार) तो नीचे से शुरू करो। 4 सीढ़ी पूरी चढ़ गए तो ₹12 invest पर ₹12 profit।

### 8. D'Alembert (धीमा सुधार)

**उदाहरण:** जैसे cycle चलाना सीख रहे हो — गिरे तो थोड़ा careful बढ़ो (+1 unit), balance बन गया तो thoda relax (-1 unit)। कभी एकदम तेज़ नहीं (Martingale जैसा double नहीं)। बहुत slow recovery, लेकिन कभी बड़ा crash नहीं।

### 9. Oscar's Grind (कंजूस का तरीका)

**उदाहरण:** जैसे कोई बहुत patience वाला दुकानदार जो सिर्फ ₹1 profit कमाकर दुकान बंद कर देता है। Bet तभी बढ़ाता है जब जीत हो AND अभी cycle में loss हो। ₹1 profit आया? बस, reset।

---

## Auto-Switch (अपने आप बदलो)

**उदाहरण:** जैसे experienced driver — highway पर fast gear, traffic में low gear, बारिश में careful। Bot भी हर 25 rounds में देखता है — कौन सी strategy score अच्छा कर रही है, उस पर switch कर देता है।

**नियम:**
- कम-से-कम 15 rounds एक strategy पर रहो (बहुत जल्दी मत बदलो)
- Goal Seeker और Sniper को छोड़कर बाकी सब में switch कर सकता है (इन दोनों का अपना lifecycle है)
- Win rate, drawdown, EV सब मिलाकर score बनाता है

---

## Dashboard Panel

Screen पर एक floating panel दिखता है जिसमें सब live data है:

**Decision Engine:**
- EV — इस round में फायदे की संभावना कितनी है
- Win Probability — जीतने का % chance
- Target — किस multiplier पर cash out करेंगे
- Kelly % — bankroll का कितना % लगा रहे हैं
- Volatility — अभी market कितना "भड़का" हुआ है
- Bet size — इस round में कितने ₹ लगा रहे हैं
- Reason — "क्यों" bet लगाई / skip किया (plain English में)

**Stats:**
- Mean crash, Standard Deviation
- 1.5x/2x/3x से ऊपर जाने का %
- Last 20 rounds का mini graph (हरा = अच्छा, लाल = बुरा)

**Bankroll:**
- शुरुआत में कितना था, अभी कितना है, highest कितना गया, फायदा/नुकसान

---

## Settings (जो आप बदल सकते हैं)

| Setting | Default | मतलब |
|---------|---------|-------|
| Starting Bankroll | ₹1000 | शुरू में कितने पैसे |
| Max Rounds | 100 | कितने rounds के बाद बंद |
| Drawdown Stop | 5% | इतना % गिरा तो बंद |
| Take-Profit | 110% | इतना % बना तो बंद |
| Simulation Mode | On | नकली mode (practice) |

---

## Simulation Mode (अभ्यास मोड)

**उदाहरण:** जैसे pilot पहले simulator में उड़ान भरता है, फिर असली plane में। Bot का simulation mode:
- नकली crash points बनाता है (real game जैसे)
- पूरा algorithm चलाता है — Kelly, EV, सब
- लेकिन असली पैसे नहीं लगता
- Real game से interact नहीं करता

पहले simulation में test करो, comfortable लगे तब ही real mode ON करो।

---

## गणित की ईमानदारी (Mathematical Honesty)

यह सबसे ज़रूरी section है। इसे ज़रूर पढ़ें:

**1. कोई भी strategy game को "तोड़" नहीं सकती।**
Game का house edge ~3% है। इसका मतलब — लंबे समय में, game हमेशा जीतता है। यह provably fair RNG (random number generator) है — कोई pattern नहीं है।

**2. हर round independent है।**
Game को याद नहीं कि पिछले round में क्या हुआ। अगर पिछले 10 rounds में 10x नहीं आया, तो अगले round में 10x आने का chance SAME है — न बढ़ा, न घटा। यह "Gambler's Fallacy" है।

**उदाहरण:** सिक्का 10 बार heads आया। 11वीं बार heads आने का chance अभी भी 50% है — सिक्के को याद नहीं कि पहले क्या आया।

**3. तो bot करता क्या है?**
- **Discipline:** अंधाधुंध bet नहीं लगाने देता
- **Risk Management:** बड़ा नुकसान होने से पहले रोकता है
- **Sizing:** जितनी edge है, उतनी ही bet लगाता है (ज्यादा नहीं)
- **Goal Optimization:** अगर target ₹1100 है और stop-loss ₹950 है, तो P(₹1100 पहुंचने) maximize करता है

**4. Gambler's Ruin Theorem:**
अगर आप अनंत काल तक खेलते रहें, तो house ALWAYS जीतता है। Bot का काम है — **जल्दी goal तक पहुंचो और बंद करो** इससे पहले कि math आपके खिलाफ काम करे।

**5. यह bot क्या है:**
- एक disciplined betting assistant
- एक risk calculator
- एक "कब रुकना है" reminder

**6. यह bot क्या नहीं है:**
- भविष्यवाणी करने वाला
- पैसे बनाने की guarantee
- Game को beat करने का तरीका

---

## Disclaimer (अस्वीकरण)

यह शैक्षिक और मनोरंजन उद्देश्यों के लिए है। House edge (~3%) का मतलब है कि कोई भी strategy long-term profit guarantee नहीं कर सकती। यह bot बुरे decisions कम करता है — risk खत्म नहीं करता।

**याद रखें:** सबसे अच्छी gambling strategy है — **जितना हारने की हिम्मत है, उतना ही खेलो। और goal मिल जाए तो उठ जाओ।**
