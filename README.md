# Dingel Hafizia App — Firebase-free clean restart

এই সংস্করণে Firebase নেই। Backend-এর জন্য Node.js + Express + MongoDB এবং frontend-এর জন্য React + Vite ব্যবহার করা হয়েছে। ভবিষ্যতে Firebase যোগ করার জায়গা রাখা যাবে।

## Run
1. MongoDB চালু করুন।
2. `backend/.env.example` কপি করে `.env` করুন এবং প্রয়োজন হলে `MONGO_URI` বদলান।
3. `backend` এ: `npm install` তারপর `npm start`
4. `frontend` এ: `npm install` তারপর `npm start`
5. ব্রাউজারে Vite যে URL দেখাবে (সাধারণত `http://localhost:5173`) খুলুন।