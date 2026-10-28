import { Cashfree } from "cashfree-pg";

const environment = process.env.CASHFREE_ENV === "PRODUCTION" ? Cashfree.PRODUCTION : Cashfree.SANDBOX;

const clientId = process.env.CASHFREE_CLIENT_ID;
const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Cashfree configuration is incomplete. Check CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET in your backend .env file.");
}

const cashfree = new Cashfree(environment, clientId, clientSecret);

export default cashfree;