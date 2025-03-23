import KJUR from 'jsrsasign';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const SHEET_NAME = 'Sheet1';
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = import.meta.env.VITE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

class SheetsService {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  async getAccessToken() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const claim = {
        iss: SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      const sHeader = JSON.stringify(header);
      const sClaim = JSON.stringify(claim);
      const sJWT = KJUR.jws.JWS.sign('RS256', sHeader, sClaim, PRIVATE_KEY);

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: sJWT,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to get access token: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Google Sheets. Please check your credentials.');
    }
  }

  async addReport(latitude, longitude) {
    try {
      const timestamp = new Date().toISOString();
      const values = [[timestamp, latitude, longitude]];
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            values,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to add report: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding report:', error);
      throw new Error('Failed to add report. Please try again later.');
    }
  }

  async getReports() {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to get reports: ${response.status}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error getting reports:', error);
      throw new Error('Failed to fetch reports. Please try again later.');
    }
  }
}

export const sheetsService = new SheetsService(); 