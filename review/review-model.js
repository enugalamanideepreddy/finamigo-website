(function(root){
'use strict';
const labels={"groceries": "Groceries", "food_dining": "Food & Dining", "fuel": "Fuel", "public_transport": "Public Transport", "taxi_ride_hailing": "Taxi & Ride-hailing", "vehicle_maintenance": "Vehicle Maintenance", "parking_tolls": "Parking & Tolls", "rent": "Rent", "home_maintenance": "Home Maintenance", "electricity": "Electricity", "water": "Water", "cooking_gas": "Cooking Gas", "internet_mobile": "Internet & Mobile", "household_supplies": "Household Supplies", "healthcare": "Healthcare", "insurance": "Insurance", "education": "Education", "childcare": "Childcare", "pet_care": "Pet Care", "domestic_help": "Domestic Help", "clothing_accessories": "Clothing & Accessories", "electronics": "Electronics", "furniture_appliances": "Furniture & Appliances", "personal_care": "Personal Care", "shopping_unspecified": "Shopping\u2014unspecified", "entertainment": "Entertainment", "digital_subscriptions": "Digital Subscriptions", "fitness_wellness": "Fitness & Wellness", "hobbies": "Hobbies", "travel_accommodation": "Travel & Accommodation", "gifts": "Gifts", "donations": "Donations", "taxes": "Taxes", "bank_fees_interest": "Bank Fees & Interest", "investments": "Investments", "salary": "Salary", "freelance_business_income": "Freelance & Business Income", "rental_income": "Rental Income", "interest_dividends": "Interest & Dividends", "cashback_rewards": "Cashback & Rewards", "other_income": "Other Income", "transfers": "Transfers", "loan_payments": "Loan payments", "cash_withdrawals": "Cash Withdrawals", "refunds_reimbursements": "Refunds & Reimbursements", "other_expense": "Other Expense", "unclassified": "Unclassified", "service_fees_charges": "Service Fees & Charges", "reversals": "Reversals", "business_expenses": "Business Expenses", "depreciating_assets": "Depreciating Assets", "loan_amount": "Loan amount", "atm_withdrawal": "ATM Withdrawal"};
function prediction(row,prior,predictions,run){
 if(row[22])return null; // Parent predictions cannot grade item-level decisions.
 if(prior?.model_prediction)return prior.model_prediction;
 const p=predictions?.[String(row[0])];
 if(!p||!labels[p.suggested_category_id])return null;
 return {run,category_id:p.suggested_category_id,category:labels[p.suggested_category_id],transaction_id:row[0],score_margin:p.score_margin??null};
}
function feedback(original,actual){return original?{predicted_category:original.category,actual_category:actual,correct:original.category===actual,action:original.category===actual?'confirmed':'corrected'}:null;}
function metrics(reviews,run){const rows=Object.values(reviews).filter(r=>r.status!=='undone'&&r.model_prediction?.run===run&&r.model_feedback);return {confirmed:rows.length,correct:rows.filter(r=>r.model_feedback.correct===true).length};}
root.ReviewModel={prediction,feedback,metrics};
if(typeof module!=='undefined')module.exports=root.ReviewModel;
})(typeof window!=='undefined'?window:globalThis);
