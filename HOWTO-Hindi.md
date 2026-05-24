# Aviator Bot कैसे चलाएं — आसान हिंदी में

बिल्कुल शुरू से, कदम-दर-कदम।

---

## Aviator Game क्या है?

**उदाहरण:** सोचिए एक गुब्बारा ऊपर जा रहा है। जितना ऊपर जाएगा, उतना ज्यादा पैसा मिलेगा। लेकिन किसी भी वक्त फट सकता है। आपको गुब्बारा फटने से पहले "पैसे निकालो" बटन दबाना है।

- गुब्बारा ऊपर जाता है: 1.00x ... 1.50x ... 2.00x ... 5.00x ...
- अगर आपने ₹100 लगाए और 2.0x पर निकाले → आपको ₹200 मिले (₹100 फायदा)
- अगर गुब्बारा 1.8x पर फट गया और आपने 2.0x तक इंतज़ार किया → आपके ₹100 गए

**सच्चाई:** कब फटेगा — यह पूरी तरह random है। कोई नहीं बता सकता। यह bot भविष्य नहीं बताता — यह **समझदारी से खेलने** में मदद करता है।

---

## Step 1: Bot Install करना

**उदाहरण:** जैसे phone में app install करते हैं, वैसे ही Chrome में extension install करना है।

1. यह पूरा `aviator-strategy-bot` folder अपने computer में रखो
2. Chrome browser खोलो
3. ऊपर address bar में लिखो: `chrome://extensions/` और Enter दबाओ
4. ऊपर दाईं तरफ **Developer mode** का switch ON करो
5. **Load unpacked** बटन दबाओ
6. वो folder select करो जो download किया था
7. Done! Extension install हो गया — ऊपर toolbar में icon दिखेगा

---

## Step 2: Game खोलना

1. जिस website पर Aviator game है, वो खोलो
2. Game की screen दिखनी चाहिए (जहां plane उड़ता है)
3. ऊपर toolbar में bot का icon click करो
4. Screen की दाईं तरफ एक dark color का panel खुलेगा — यही bot का "dashboard" है

---

## Step 3: पहले Practice करो (Simulation Mode)

**बहुत ज़रूरी:** पहले असली पैसों से मत खेलो। पहले "नकली" mode में देखो कि bot कैसे काम करता है।

**उदाहरण:** जैसे driving school में पहले simulator में गाड़ी चलाते हैं, road पर नहीं।

1. Panel में **Starting Bankroll** लिखो (जैसे 1000)
2. **Simulation Mode** पर tick लगा होना चाहिए (default में लगा रहता है)
3. **START** बटन दबाओ

अब क्या होगा:
- Bot नकली game चलाएगा (असली game जैसा ही दिखता है)
- हर round में decide करेगा — bet करें या skip करें
- पैसे बढ़ते-घटते दिखाएगा
- **असली पैसा नहीं लगेगा**
- 50-100 rounds देखो, समझो कि bot कैसा खेल रहा है

---

## Step 4: Mode चुनो

दो तरीके हैं:

### तरीका A: Daily Autopilot (शुरुआती लोगों के लिए सबसे अच्छा)

**उदाहरण:** जैसे taxi में बैठ गए और driver को बोला "10 km चलो, ₹500 से ज्यादा खर्च मत करना"। Driver रास्ता खुद decide करेगा, traffic देखेगा, और budget में पहुंचा देगा।

1. **Daily Autopilot** पर tick करो
2. **Daily Target** लिखो (default 10% है — मतलब ₹1000 लगाए तो ₹100 profit target)
3. START दबाओ

अब bot क्या करेगा:
- **पहले 30 rounds सिर्फ देखेगा** (game कैसा चल रहा है — "market feel" लेगा)
- जब conditions अच्छी लगेंगी → bet लगाना शुरू करेगा
- खुद decide करेगा कौन सी strategy best है अभी
- **₹100 profit हो गया? बस! बंद।** सिर्फ देखता रहेगा, bet नहीं लगाएगा
- अगर हालात बिगड़ रहे हैं → खुद बंद हो जाएगा (ज्यादा नुकसान से पहले)

**आपको कुछ करने की ज़रूरत नहीं।** Bot सब संभालेगा।

### तरीका B: खुद Strategy चुनो

अगर आप खुद control रखना चाहते हैं:

**उदाहरण:** जैसे खुद गाड़ी चलाना — आप decide करोगे कब तेज़ चलाना है, कब slow।

| Strategy | कैसी है | किसके लिए |
|----------|---------|-----------|
| **Quant/Kelly** | All-rounder, सिर्फ अच्छे मौके पर bet | जो बीच का रास्ता चाहें |
| **Goal Seeker** | Target के पास → safe, दूर → aggressive | जिनका clear target हो |
| **Sniper** | 50 round देखो, फिर एक बड़ी bet | जिन्हें patience हो |
| **Flat Conservative** | हर बार 1% bet, 1.5x पर cash out | जो safe खेलना चाहें |
| **Flat Balanced** | हर बार 1% bet, 2.0x पर cash out | थोड़ा risk ठीक हो |

Strategy select करो, **Drawdown Stop** और **Take-Profit** set करो, START दबाओ।

---

## Step 5: असली पैसों से खेलना

जब Simulation में 100+ rounds देख लिए और समझ आ गया:

**उदाहरण:** Simulator में 100 बार गाड़ी चलाई, अब road पर जाने का वक्त है। लेकिन पहले कम speed से, highway पर नहीं।

1. STOP दबाओ
2. **Simulation Mode** का tick हटाओ
3. **Starting Bankroll** में वो amount डालो जो game में आपके account में है
4. Stops set करो: **Drawdown 5%** (₹50 से ज्यादा loss पर बंद), **Take-Profit 110%** (₹100 profit पर बंद)
5. START दबाओ

अब bot:
- Game से असली multiplier पढ़ेगा
- Game की screen पर bet amount भरेगा
- BET button दबाएगा
- सही वक्त पर CASH OUT दबाएगा
- जब condition खराब हो → skip करेगा (bet नहीं लगाएगा)

---

## Step 6: Dashboard पर क्या देखें

Panel पर ये चीज़ें दिखती हैं:

| दिखने वाली चीज़ | मतलब |
|----------------|-------|
| **Phase** | Bot अभी क्या कर रहा है (देख रहा / खेल रहा / बंद हो गया) |
| **Strategy** | कौन सी strategy चल रही है |
| **P/L** | कितना फायदा या नुकसान हुआ (% में) |
| **EV** | इस bet में फायदा होने की संभावना |
| **Reason** | Bot ने ऐसा क्यों किया (English में लिखा होता है) |
| **Skip count** | कितने rounds skip किए |

---

## सुनहरे नियम (Golden Rules)

### 1. सिर्फ वो पैसे लगाओ जो हारने की हिम्मत हो

**उदाहरण:** जैसे शादी में जुआ खेलते हैं — जेब में ₹500 रखे, हार गए तो चलेगा। लेकिन बच्चों की fees नहीं लगानी।

### 2. छोटी शुरुआत करो

**उदाहरण:** दुकान खोल रहे हो तो पहले ठेला लगाओ, सीधा mall में shop मत लो।

Minimum bet से शुरू करो। 200 rounds तक देखो, फिर बढ़ाओ।

### 3. पहले Simulation, फिर Real

**उदाहरण:** Swimming pool में पहले shallow end में जाओ, सीधे deep end में मत कूदो।

कम-से-कम 100 rounds simulation में चलाओ।

### 4. Target मिला तो उठ जाओ

**उदाहरण:** मंदिर में दान-पेटी में ₹100 डालने गए, ₹100 डाल दिया — अब वापस लेने नहीं जाओगे। वैसे ही, bot बोले "target हो गया" तो **बंद करो**। और खेलने का मन करेगा — लेकिन मत खेलो।

यही सबसे ज़रूरी discipline है।

### 5. Loss chase मत करो

**उदाहरण:** ₹100 हार गए, अब ₹200 लगाकर वापस लाने की सोच रहे हो? यह रास्ता बर्बादी का है।

Bot ने "Smart Quit" बोला? — मानो। कल फिर आना।

### 6. Bot predict नहीं करता

**उदाहरण:** जैसे helmet पहनने से accident नहीं रुकता, लेकिन चोट कम लगती है। Bot helmet है — game का result नहीं बदलता, लेकिन नुकसान कम करता है।

---

## जल्दी शुरू करने का तरीका (Quick Start)

| आप क्या चाहते हैं | क्या करें |
|-------------------|-----------|
| बस देखना है कैसे काम करता है | Simulation ON, Bankroll 1000, START |
| रोज़ 10% profit, बिना सोचे | Autopilot ON, Target 10%, START |
| बिल्कुल safe खेलना | Flat Conservative, Drawdown 5% |
| बड़ा multiplier पकड़ना | Sniper strategy, patience रखो |
| सब bot पर छोड़ना | Autopilot ON, defaults, START |

---

## अक्सर पूछे जाने वाले सवाल (FAQ)

**सवाल: क्या bot से guarantee profit होगा?**
जवाब: नहीं। Game में 3% house edge है — मतलब लंबे समय में game हमेशा जीतता है। Bot का काम है — छोटे target तक पहुंचो और निकल जाओ।

**सवाल: सबसे अच्छी strategy कौन सी है?**
जवाब: Daily Autopilot — ज्यादातर लोगों के लिए। यह खुद conditions देखकर strategy बदलता है।

**सवाल: कितने पैसों से शुरू करूं?**
जवाब: जितने हारने से आपकी ज़िंदगी पर कोई फर्क न पड़े। Entertainment budget समझो — जैसे movie ticket।

**सवाल: Bot बहुत rounds skip कर रहा है, कुछ गड़बड़ है?**
जवाब: बिल्कुल नहीं! Skip करना bot की सबसे ताकतवर power है। इसका मतलब — अभी conditions अच्छी नहीं हैं, पैसे बचा रहा है। जैसे बारिश में घर बैठना smart है, बाहर भीगना नहीं।

**सवाल: Bot ने "Smart Quit" बोला, अब?**
जवाब: मतलब bot ने समझ लिया कि आज का दिन अच्छा नहीं है। जैसे experienced दुकानदार बोलता है "आज बाज़ार ठंडा है, दुकान बंद करो।" कल फिर try करो।

**सवाल: Daily Target 10% से बदल सकते हैं?**
जवाब: हां। Autopilot config में target change करो। लेकिन ध्यान रहे:
- 5-8% = आसान, जल्दी मिल जाता है, कम risk
- 10% = balanced (default)
- 15-20% = मुश्किल, ज्यादा rounds लगेंगे, ज्यादा risk

**सवाल: सारा दिन चलाऊं?**
जवाब: नहीं! छोटी session (50-150 rounds) best है। जितना ज्यादा खेलोगे, उतना ज्यादा house edge काम करता है। जैसे — एक samosa खाओ तो मज़ा, 10 खाओ तो तबियत खराब।

**सवाल: Bot ने strategy बदल दी बीच में, ठीक है?**
जवाब: हां, Autopilot mode में यह normal है। जैसे driver traffic देखकर रास्ता बदलता है — destination वही रहता है, रास्ता condition के हिसाब से बदलता है।

---

## पूरा Process एक नज़र में

```
Install करो
    ↓
Simulation में 100 rounds चलाओ (नकली पैसों से)
    ↓
समझ आ गया? → Real mode ON करो (छोटी amount से)
    ↓
Autopilot ON, Target 10%
    ↓
START दबाओ
    ↓
Bot काम करेगा — आप बस देखो
    ↓
Target मिला? → बस, बंद। आज का काम खत्म।
    ↓
कल फिर आना।
```

---

## आखिरी बात

**यह bot एक समझदार दोस्त जैसा है जो आपके कान में बोलता है:**
- "अभी मत खेलो, wait करो"
- "अभी अच्छा मौका है, लगाओ"
- "बस बहुत हो गया, उठो"

सुनोगे तो फायदा। नहीं सुनोगे तो bot बना के क्या करोगे?

**याद रखो:** सबसे अच्छा gambler वो नहीं जो ज्यादा जीतता है — वो है जो सही वक्त पर **रुक** जाता है।
