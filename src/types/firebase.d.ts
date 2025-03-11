
interface FirebaseGlobal {
  app: any;
  auth: any;
  db: any;
}

interface Window {
  firebase?: FirebaseGlobal;
}
