# دليل ربط swiftmove بـ swiftmove-L

## ملخص التغييرات

تم إجراء التعديلات على مشروعين، بدون أي تغيير في واجهة الزائر (التصميم):

---

## 🔵 مشروع الزائر — swiftmove

### الملفات المُضافة أو المُعدّلة

| الملف | النوع | الهدف |
|---|---|---|
| `artifacts/swiftmove/src/lib/firebase-visitor.ts` | **جديد** | إعدادات Firebase تشير لمشروع swiftmove-l |
| `artifacts/swiftmove/src/hooks/useFirebaseTracking.ts` | **تعديل** | تفعيل الربط الحقيقي بدل الـ stub |
| `artifacts/swiftmove/src/App.tsx` | **تعديل** | تشغيل تتبع الزوار من أول صفحة |
| `artifacts/swiftmove/package.json` | **تعديل** | إضافة `firebase ^11.0.0` |

### ماذا يحدث الآن عند فتح الموقع؟

1. عند فتح أي صفحة → يُنشأ تلقائيًا document في مجموعة `pays` بـ Firebase مع `referenceNumber = SM-XXXXXXX`
2. يُفعَّل نظام الحضور في Realtime Database: `presence/{docId} = {online: true}`
3. يُسجَّل `onDisconnect` → عند إغلاق المتصفح يُحدَّث تلقائيًا إلى `{online: false}`
4. كل 25 ثانية يُرسَل Heartbeat لتحديث `lastActiveAt` في Firestore
5. عند ملء نموذج الحجز وإرساله → تُحفظ البيانات في Firestore:
   - `ownerName` ← الاسم الكامل
   - `phoneNumber` ← رقم الهاتف  
   - `email` ← البريد الإلكتروني
   - `fromAddress / toAddress / moveDate` ← بيانات الانتقال
   - `status` ← `"pending_review"`

---

## 🟢 لوحة التحكم — swiftmove-L

### الملفات المُعدّلة

| الملف | التغيير |
|---|---|
| `lib/firebase-services.ts` | إضافة `subscribeToPresence()` يستمع لمسار `/presence` في Realtime DB |
| `app/page.tsx` | ربط حالة Online/Offline بـ RTDB مع إعادة حساب تلقائية كل 30 ثانية |

### كيف يعمل نظام Online/Offline الآن؟

```
زائر يفتح الموقع
  ↓
RTDB: presence/{docId} = {online: true}   [فوري]
  ↓
Dashboard RTDB listener → filteredApplications يُعيد الحساب → 🟢 Online

زائر يُغلق المتصفح
  ↓
Firebase SDK: onDisconnect يُطلَق تلقائيًا
  ↓
RTDB: presence/{docId} = {online: false}   [خلال ثوانٍ]
  ↓
Dashboard RTDB listener → filteredApplications يُعيد الحساب → ⚪ Offline
```

الأولوية في الحساب:
1. **RTDB presence** (أدق — يُحدَّث فورًا عند القطع)
2. **lastActiveAt 30s window** (للزوار القدامى بدون RTDB)

---

## 🚀 خطوات التطبيق

### swiftmove — الخطوات

```bash
# 1. ضع الملفات الجديدة/المعدّلة
# انسخ الملفات من integration-patches/swiftmove-files/ إلى مشروعك

# 2. ثبّت Firebase
pnpm --filter @workspace/swiftmove add firebase

# 3. ادفع للـ GitHub
git add artifacts/swiftmove/
git commit -m "feat: Firebase visitor tracking & Online/Offline presence"
git push
```

### swiftmove-L — الخطوات

```bash
# 1. ضع الملفات المعدّلة
# انسخ الملفات من integration-patches/swiftmove-L-files/ إلى مشروعك

# 2. ادفع للـ GitHub
git add lib/firebase-services.ts app/page.tsx
git commit -m "feat: RTDB presence for instant Online/Offline detection"
git push
```

---

## بديل: تطبيق الـ Patch مباشرة

```bash
# في مشروع swiftmove:
git am < swiftmove-integration.patch

# في مشروع swiftmove-L:
git am < swiftmove-L-presence.patch
```

---

## ✅ اختبار المسار الكامل

```
1. افتح موقع swiftmove
   → يظهر زائر جديد في لوحة swiftmove-L بـ 🟢 Online

2. اذهب لصفحة /book واملأ نموذج الحجز
   → تظهر بياناتك (الاسم، الهاتف، البريد) في لوحة التحكم

3. أغلق المتصفح
   → خلال ثوانٍ يتغير إلى ⚪ Offline في لوحة التحكم

4. افتح الموقع مجددًا في نفس المتصفح
   → يرجع لـ 🟢 Online (نفس document، لأن sessionStorage يحتفظ بالـ ID)
```

---

## ملاحظات تقنية

- **لا تغيير في تصميم أو واجهة swiftmove** — فقط تفعيل `useFirebaseTracking` الذي كان موجودًا أصلًا كـ stub
- **نفس Firebase project** (`swiftmove-l`) للمشروعين
- **نفس Firestore collection** (`pays`) التي تقرأها لوحة التحكم
- الربط يعمل بدون Cloud Functions أو Backend وسيط
- لا يحتاج إلى أي مفاتيح أو إعدادات إضافية (Firebase config مدمج في الكود)
