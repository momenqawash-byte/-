
import { LedgerEntry, TransactionType, FinancialChannel, Record, Expense, Purchase, CashTransfer, DebtItem, PlaceLoan, BankAccount, InventorySnapshot, PricingConfig, DayCycle, PeriodLock, SavingPlan } from './types';
import { generateId, getLocalDate, getDaysInMonth, getAllDaysOfMonth, formatCurrency } from './utils';

// --- PARTNERS CONSTANT (Matching App.tsx) ---
export const GLOBAL_PARTNERS = [
    { id: 'abu_khaled', name: 'أبو خالد', percent: 34 },
    { id: 'khaled', name: 'خالد', percent: 33 },
    { id: 'abdullah', name: 'عبد الله', percent: 33 }
];

// --- CORE SELECTORS ---

export const getLedgerBalance = (ledger: LedgerEntry[], channel: FinancialChannel, accountId?: string): number => {
    return ledger.reduce((acc, entry) => {
        if (entry.channel !== channel) return acc;
        
        // FIX: Only filter by accountId if a specific, non-empty ID is requested.
        if (accountId && entry.accountId !== accountId) return acc;

        // CRITICAL FIX: Ignore Partner-Funded Purchases from Treasury Totals
        // Even if recorded as 'in' to increase partner entitlement, it shouldn't increase the physical cash/bank total.
        const isPartnerPurchase = entry.type === TransactionType.PARTNER_DEPOSIT && 
                                 (entry.description.includes('شراء') || entry.description.includes('بضاعة'));
        
        if (isPartnerPurchase) return acc;
        
        if (entry.direction === 'in') {
            if (channel === 'bank' && entry.transferStatus && entry.transferStatus !== 'confirmed') {
                return acc;
            }
            return acc + (entry.amount || 0);
        }
        if (entry.direction === 'out') return acc - (entry.amount || 0);
        return acc;
    }, 0);
};

export const getSavingsBalance = (ledger: LedgerEntry[]): number => {
    return ledger.reduce((acc, entry) => {
        if (entry.type === TransactionType.SAVING_DEPOSIT) return acc + entry.amount;
        if (entry.type === TransactionType.SAVING_WITHDRAWAL) return acc - entry.amount;
        return acc;
    }, 0);
};

export const resolveActorName = (entry: LedgerEntry): string => {
    // 1. If explicitly linked to a Partner
    if (entry.partnerName) return entry.partnerName;
    if (entry.partnerId) {
        const partner = GLOBAL_PARTNERS.find(p => p.id === entry.partnerId);
        if (partner) return partner.name;
    }

    // 2. If it's a bank transfer with a sender name
    if (entry.senderName) return entry.senderName;

    // 3. Contextual Names based on Transaction Type
    if (entry.type === TransactionType.INCOME_SESSION) return "زبون (جلسة)";
    if (entry.type === TransactionType.INCOME_PRODUCT) return "زبون (منتجات)";
    if (entry.type === TransactionType.DEBT_PAYMENT) return "زبون (سداد دين)";
    if (entry.type === TransactionType.DEBT_CREATE) return "زبون (تسجيل دين)";
    
    if (entry.type === TransactionType.EXPENSE_OPERATIONAL) return "مصاريف تشغيلية";
    if (entry.type === TransactionType.EXPENSE_PURCHASE) return "مشتريات للمكان";
    
    if (entry.type === TransactionType.LOAN_RECEIPT) return "دائن (قرض)";
    if (entry.type === TransactionType.LOAN_REPAYMENT) return "دائن (سداد)";
    
    if (entry.type === TransactionType.SAVING_DEPOSIT) return "صندوق الادخار";
    
    if (entry.type === TransactionType.LIQUIDATION_TO_APP) return "تطبيق / بنك";

    // 4. Fallback
    return 'جهة غير محددة';
};

export const getLedgerStatsForPeriod = (ledger: LedgerEntry[], startDate: string, endDate: string) => {
    const periodEntries = ledger.filter(e => e.dateKey >= startDate && e.dateKey <= endDate);
    const income = periodEntries
        .filter(e => e.type === TransactionType.INCOME_SESSION || e.type === TransactionType.INCOME_PRODUCT)
        .reduce((s, e) => s + (e.amount || 0), 0);
    const sessionIncome = periodEntries.filter(e => e.type === TransactionType.INCOME_SESSION).reduce((s,e) => s + (e.amount || 0), 0);
    const productIncome = periodEntries.filter(e => e.type === TransactionType.INCOME_PRODUCT).reduce((s,e) => s + (e.amount || 0), 0);
    
    const expenses = periodEntries
        .filter(e => e.type === TransactionType.EXPENSE_OPERATIONAL || e.type === TransactionType.EXPENSE_PURCHASE)
        .reduce((s, e) => s + (e.amount || 0), 0);
        
    const debtCreated = periodEntries
        .filter(e => e.type === TransactionType.DEBT_CREATE)
        .reduce((s, e) => s + (e.amount || 0), 0);
    const debtPaid = periodEntries
        .filter(e => e.type === TransactionType.DEBT_PAYMENT)
        .reduce((s, e) => s + (e.amount || 0), 0);
        
    // Treasury logic (Using the smart function above)
    const totalNetCash = getLedgerBalance(ledger, 'cash');
    const totalNetBank = getLedgerBalance(ledger, 'bank');
    
    // FIX: Calculate net cash flow for the period to fix "Property 'netCashFlow' does not exist" error in Summary.tsx
    const netCashFlow = periodEntries.reduce((acc, entry) => {
        if (entry.channel !== 'cash') return acc;
        
        const isPartnerPurchase = entry.type === TransactionType.PARTNER_DEPOSIT && 
                                 (entry.description.includes('شراء') || entry.description.includes('بضاعة'));
        if (isPartnerPurchase) return acc;
        
        if (entry.direction === 'in') return acc + (entry.amount || 0);
        if (entry.direction === 'out') return acc - (entry.amount || 0);
        return acc;
    }, 0);

    return { 
        income, sessionIncome, productIncome, expenses, debtCreated, debtPaid, 
        totalNetCash, totalNetBank, netCashFlow
    };
};

export const getLedgerTotals = (ledger: LedgerEntry[], period: 'today' | 'month' | 'custom', dateReference: string) => {
    let startDate = dateReference;
    let endDate = dateReference;
    if (period === 'month') {
        startDate = dateReference.slice(0, 7) + '-01';
        const year = parseInt(startDate.split('-')[0]);
        const month = parseInt(startDate.split('-')[1]);
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    }
    return getLedgerStatsForPeriod(ledger, startDate, endDate);
};

export const getPartnerStats = (ledger: LedgerEntry[], partnerId: string) => {
    const entries = ledger.filter(e => e.partnerId === partnerId);
    const withdrawals = entries.filter(e => e.type === TransactionType.PARTNER_WITHDRAWAL).reduce((s, e) => s + (e.amount || 0), 0);
    const repayments = entries.filter(e => e.type === TransactionType.PARTNER_DEPOSIT || e.type === TransactionType.PARTNER_DEBT_PAYMENT).reduce((s, e) => s + (e.amount || 0), 0);
    return { withdrawals, repayments, currentNet: withdrawals - repayments, entries };
};

export const getTreasuryStats = (ledger: LedgerEntry[], accounts: BankAccount[]) => {
    const cashBalance = getLedgerBalance(ledger, 'cash');
    const totalBankBalance = getLedgerBalance(ledger, 'bank');
    const accountsStats = accounts.map(acc => {
        const accEntries = ledger.filter(e => e.channel === 'bank' && e.accountId === acc.id);
        const totalIn = accEntries.filter(e => e.direction === 'in').reduce((s, e) => s + (e.amount || 0), 0);
        const totalOut = accEntries.filter(e => e.direction === 'out').reduce((s, e) => s + (e.amount || 0), 0);
        return { ...acc, balance: getLedgerBalance(ledger, 'bank', acc.id), totalIn, totalOut };
    });
    return { cashBalance, totalBankBalance, accountsStats };
};

export const getPartnerDebtSummary = (debtsList: DebtItem[], partnerId: string) => {
    const items = debtsList.filter(d => d.partnerId === partnerId);
    const totalDebt = items.reduce((sum, d) => sum + (d.amount || 0), 0);
    const placeDebt = items.filter(d => d.debtSource === 'place' || !d.debtSource).reduce((sum, d) => sum + (d.amount || 0), 0);
    return { totalDebt, placeDebt, items };
};

export const getPlaceLoanStats = (loan: PlaceLoan) => {
    const paid = loan.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = loan.principal - paid;
    const progress = loan.principal > 0 ? Math.min(100, (paid / loan.principal) * 100) : 0;
    return { paid, remaining, progress, isFullyPaid: remaining <= 0.01 };
};

export const checkLoanStatusAfterPayment = (loan: PlaceLoan, newAmount: number): 'active' | 'closed' => {
     const currentPaid = loan.payments.reduce((s, p) => s + p.amount, 0);
     return (currentPaid + newAmount) >= (loan.principal - 0.01) ? 'closed' : 'active';
};

export const getCostAnalysisView = (ledger: LedgerEntry[], records: Record[], monthKey: string) => {
    const days = getAllDaysOfMonth(monthKey);
    return days.map(date => {
        const periodEntries = ledger.filter(e => e.dateKey === date);
        const dayRecords = records.filter(r => r.endTime.startsWith(date));

        const income = periodEntries.filter(e => e.type === TransactionType.INCOME_SESSION || e.type === TransactionType.INCOME_PRODUCT).reduce((s, e) => s + (e.amount || 0), 0);
        const expenses = periodEntries.filter(e => e.type === TransactionType.EXPENSE_OPERATIONAL || e.type === TransactionType.EXPENSE_PURCHASE).reduce((s, e) => s + (e.amount || 0), 0);
        const savings = periodEntries.filter(e => e.type === TransactionType.SAVING_DEPOSIT).reduce((s, e) => s + (e.amount || 0), 0);
        const loanRepayments = periodEntries.filter(e => e.type === TransactionType.LOAN_REPAYMENT).reduce((s, e) => s + (e.amount || 0), 0);

        const drinksCost = dayRecords.reduce((s, r) => s + (r.drinksCost || 0), 0);
        const cardsCost = dayRecords.reduce((s, r) => s + (r.internetCardsCost || 0), 0);
        const placeCost = dayRecords.reduce((s, r) => s + (r.placeCost || 0), 0);
        const cogs = drinksCost + cardsCost + placeCost;

        return {
            date,
            totalRevenue: income,
            totalExpenses: expenses,
            totalSavings: savings,
            totalLoanRepayments: loanRepayments,
            totalCOGS: cogs,
            netProfit: income - expenses - savings - loanRepayments - cogs,
        };
    }).filter(d => d.totalRevenue > 0 || d.totalExpenses > 0 || d.totalSavings > 0 || d.totalLoanRepayments > 0);
};

export const getExpensesPageStats = (purchases: Purchase[], savingPlans: SavingPlan[], currentMonth: string) => {
    const dailyPurchases = purchases.filter(p => p.date?.startsWith(currentMonth));
    const totalDaily = dailyPurchases.reduce((s, p) => s + p.amount, 0);
    
    const fixedPlans = savingPlans.filter(p => p.category === 'expense');
    const totalFixedMonthly = fixedPlans.reduce((s, e) => s + e.amount, 0); 
    const totalDailyFixed = fixedPlans.reduce((s, e) => s + (e.amount / 30), 0); 

    return { totalDaily, totalFixedMonthly, totalDailyFixed, fixedCount: fixedPlans.length };
};

export const getSnapshotDistributionTotals = (snapshot: InventorySnapshot) => {
    const totalCashDist = snapshot.partners?.reduce((sum, p) => sum + (p.finalPayoutCash || 0), 0) || 0;
    const totalBankDist = snapshot.partners?.reduce((sum, p) => sum + (p.finalPayoutBank || 0), 0) || 0;
    return { totalCashDist, totalBankDist };
};

export const validateOperation = (date: string, lock: PeriodLock | null) => {
    if (lock && date <= lock.lockedUntil) throw new Error(`لا يمكن إجراء عمليات في فترة مغلقة (قبل ${lock?.lockedUntil}). يرجى فتح الفترة أولاً.`);
};

export const checkLedgerIntegrity = (ledger: LedgerEntry[]): string[] => {
    const errors: string[] = [];
    const cash = getLedgerBalance(ledger, 'cash');
    if (cash < -0.01) errors.push(`Critical: Negative Cash Balance (${cash})`);
    return errors;
};

export const validateTransaction = (ledger: LedgerEntry[], amount: number, channel: FinancialChannel, accountId?: string): void => {
    if (channel === 'receivable') return;
    const currentBalance = getLedgerBalance(ledger, channel, accountId);
    if ((currentBalance - amount) < -0.01) {
        throw new Error(`رصيد ${channel === 'cash' ? 'الصندوق (كاش)' : 'الحساب البنكي المحدد'} غير كافٍ. المتوفر حالياً: ${currentBalance.toFixed(2)} ₪ فقط.`);
    }
};

export const createEntry = (
    type: TransactionType, 
    amount: number, 
    direction: 'in' | 'out', 
    channel: FinancialChannel, 
    description: string, 
    accountId?: string, 
    entityId?: string, 
    partnerId?: string, 
    date?: string, 
    referenceId?: string, 
    partnerName?: string,
    performedById?: string, 
    performedByName?: string 
): LedgerEntry => {
    return { 
        id: generateId(), 
        timestamp: new Date().toISOString(), 
        dateKey: date || getLocalDate(), 
        type, 
        amount, 
        direction, 
        channel, 
        accountId, 
        description, 
        entityId, 
        partnerId, 
        partnerName, 
        referenceId,
        performedById,
        performedByName
    };
};

export const processAutoSavings = (
    plans: SavingPlan[],
    ledger: LedgerEntry[],
    inventoryDate: string = getLocalDate()
): { entries: LedgerEntry[], updatedPlans: SavingPlan[] } => {
    const newEntries: LedgerEntry[] = [];
    const updatedPlans: SavingPlan[] = [];

    let tempLedger = [...ledger];

    for (const plan of plans) {
        if (!plan.isActive) {
            updatedPlans.push(plan);
            continue;
        }

        const lastAppliedAt = new Date(plan.lastAppliedAt);
        const currentDate = new Date(inventoryDate);
        
        lastAppliedAt.setHours(12, 0, 0, 0);
        currentDate.setHours(12, 0, 0, 0);

        const diffTime = currentDate.getTime() - lastAppliedAt.getTime();
        const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let amountToDeduct = 0;
        let description = '';

        if (daysDiff <= 0) {
            updatedPlans.push(plan); 
            continue;
        }

        if (plan.type === 'daily_saving') {
            amountToDeduct = daysDiff * plan.amount;
            description = `ادخار يومي تلقائي (${daysDiff} أيام)`;
        } else if (plan.type === 'monthly_payment') {
            const dailyRate = plan.amount / 30;
            amountToDeduct = Math.round(dailyRate * daysDiff * 100) / 100;
            description = `التزام شهري تلقائي (${daysDiff} أيام)`;
        }

        if (amountToDeduct > 0) {
            const isExpense = plan.category === 'expense';
            const entryDesc = isExpense 
                ? `تلقائي: ${plan.name || 'التزام'} (${daysDiff} يوم)` 
                : description;

            const entry = createEntry(
                isExpense ? TransactionType.EXPENSE_OPERATIONAL : TransactionType.SAVING_DEPOSIT,
                amountToDeduct,
                'out',
                plan.channel,
                entryDesc,
                plan.bankAccountId,
                generateId(),
                undefined,
                inventoryDate,
                undefined, undefined,
                'system', 'النظام الآلي'
            );
            
            newEntries.push(entry);
            tempLedger.push(entry);
            
            updatedPlans.push({
                ...plan,
                lastAppliedAt: inventoryDate
            });
        } else {
            updatedPlans.push(plan);
        }
    }

    return { entries: newEntries, updatedPlans };
};

export const calcEndDayPreviewFromLedger = (ledger: LedgerEntry[], startDate: string, bankAccounts: BankAccount[], pricingConfig: PricingConfig): DayCycle => {
    const now = new Date().toISOString();
    const todayKey = startDate.split('T')[0];
    const cycleEntries = ledger.filter(e => e.timestamp >= startDate && e.timestamp <= now);
    
    const incomeEntries = cycleEntries.filter(e => 
        e.type === TransactionType.INCOME_SESSION || 
        e.type === TransactionType.INCOME_PRODUCT || 
        e.type === TransactionType.DEBT_PAYMENT
    );

    const cashRevenue = incomeEntries.filter(e => e.channel === 'cash').reduce((s, e) => s + (e.amount || 0), 0);
    const bankRevenue = incomeEntries.filter(e => e.channel === 'bank').reduce((s, e) => s + (e.amount || 0), 0);
    const totalRevenue = cashRevenue + bankRevenue;

    const totalDebt = cycleEntries.filter(e => e.type === TransactionType.DEBT_CREATE).reduce((s, e) => s + (e.amount || 0), 0);
    
    const expenses = cycleEntries.filter(e => e.type === TransactionType.EXPENSE_OPERATIONAL || e.type === TransactionType.EXPENSE_PURCHASE).reduce((s, e) => s + (e.amount || 0), 0);

    const netCashFlow = cycleEntries.filter(e => e.channel === 'cash' && e.direction === 'in').reduce((s, e) => s + (e.amount || 0), 0) - cycleEntries.filter(e => e.channel === 'cash' && e.direction === 'out').reduce((s, e) => s + (e.amount || 0), 0);
    const netBankFlow = cycleEntries.filter(e => e.channel === 'bank' && e.direction === 'in').reduce((s, e) => s + (e.amount || 0), 0) - cycleEntries.filter(e => e.channel === 'bank' && e.direction === 'out').reduce((s, e) => s + (e.amount || 0), 0);

    const recordIds = new Set(cycleEntries.filter(e => e.type === TransactionType.INCOME_SESSION).map(e => e.entityId).filter(Boolean));

    return { 
        id: 'PREVIEW', 
        dateKey: todayKey, 
        monthKey: todayKey.slice(0, 7), 
        startTime: startDate, 
        endTime: now, 
        totalRevenue, 
        cashRevenue, 
        bankRevenue, 
        totalDiscounts: 0, 
        bankBreakdown: [], 
        totalDebt, 
        totalInvoice: totalRevenue + totalDebt, 
        totalOperationalCosts: expenses, 
        netCashFlow, 
        netBankFlow, 
        grossProfit: totalRevenue - expenses, 
        devCut: 0, 
        netProfit: 0, 
        recordCount: recordIds.size, 
        createdAt: Date.now() 
    };
};

export const calcLedgerInventory = (
    ledger: LedgerEntry[],
    records: Record[], 
    startDate: string,
    endDate: string,
    expenses: Expense[],
    pricingConfig: PricingConfig,
    electricityCost: number = 0
): InventorySnapshot => {
    
    const periodEntries = ledger.filter(e => e.dateKey >= startDate && e.dateKey <= endDate);
    
    const cashRevenuePaid = periodEntries
        .filter(e => e.channel === 'cash' && (e.type === TransactionType.INCOME_SESSION || e.type === TransactionType.INCOME_PRODUCT))
        .reduce((s, e) => s + (e.amount || 0), 0);
    const bankRevenuePaid = periodEntries
        .filter(e => e.channel === 'bank' && (e.type === TransactionType.INCOME_SESSION || e.type === TransactionType.INCOME_PRODUCT))
        .reduce((s, e) => s + (e.amount || 0), 0);

    const cashDebtCollected = periodEntries
        .filter(e => e.channel === 'cash' && e.type === TransactionType.DEBT_PAYMENT)
        .reduce((s, e) => s + (e.amount || 0), 0);
    const bankDebtCollected = periodEntries
        .filter(e => e.channel === 'bank' && e.type === TransactionType.DEBT_PAYMENT)
        .reduce((s, e) => s + (e.amount || 0), 0);

    const totalPaidRevenue = cashRevenuePaid + bankRevenuePaid;

    const periodRecords = records.filter(r => {
        const date = r.endTime.split('T')[0];
        return date >= startDate && date <= endDate;
    });

    const totalDrinksCost = periodRecords.reduce((sum, r) => sum + (r.drinksCost || 0), 0);
    const totalCardsCost = periodRecords.reduce((sum, r) => sum + (r.internetCardsCost || 0), 0);
    const totalPlaceCost = periodRecords.reduce((sum, r) => sum + (r.placeCost || 0), 0);
    const totalDirectCosts = totalDrinksCost + totalCardsCost + totalPlaceCost;

    const isVirtualExpense = (e: LedgerEntry) => 
        e.type === TransactionType.EXPENSE_OPERATIONAL && 
        (e.description.includes('تلقائي') || e.description.includes('التزام'));

    const partnerFundedExpenses = periodEntries
        .filter(e => e.type === TransactionType.PARTNER_DEPOSIT && (e.description.includes('شراء') || e.description.includes('بضاعة')))
        .reduce((s, e) => s + (e.amount || 0), 0);

    const cashExpensesPhysical = periodEntries
        .filter(e => e.channel === 'cash' && !isVirtualExpense(e) && (e.type === TransactionType.EXPENSE_OPERATIONAL || e.type === TransactionType.EXPENSE_PURCHASE))
        .reduce((s, e) => s + (e.amount || 0), 0);
    
    const bankExpensesPhysical = periodEntries
        .filter(e => e.channel === 'bank' && !isVirtualExpense(e) && (e.type === TransactionType.EXPENSE_OPERATIONAL || e.type === TransactionType.EXPENSE_PURCHASE))
        .reduce((s, e) => s + (e.amount || 0), 0);

    const virtualExpenses = periodEntries.filter(e => isVirtualExpense(e)).reduce((s, e) => s + (e.amount || 0), 0);

    const totalOperatingExpenses = cashExpensesPhysical + bankExpensesPhysical + virtualExpenses + partnerFundedExpenses;

    const totalLoanRepayments = periodEntries.filter(e => e.type === TransactionType.LOAN_REPAYMENT).reduce((s, e) => s + (e.amount || 0), 0);
    const totalSavings = periodEntries.filter(e => e.type === TransactionType.SAVING_DEPOSIT && !e.description.includes('تلقائي')).reduce((s, e) => s + (e.amount || 0), 0);

    const liquidated = periodEntries
        .filter(e => e.type === TransactionType.LIQUIDATION_TO_APP && e.direction === 'out' && e.channel === 'cash')
        .reduce((s, e) => s + (e.amount || 0), 0);
    
    const netCashInPlace = (cashRevenuePaid + cashDebtCollected) - cashExpensesPhysical - liquidated - totalLoanRepayments - totalSavings;
    const netBankInPlace = (bankRevenuePaid + bankDebtCollected) - bankExpensesPhysical + liquidated;

    const totalDebtRevenue = periodEntries.filter(e => e.type === TransactionType.DEBT_CREATE).reduce((s, e) => s + (e.amount || 0), 0);
    const grossProfit = (totalPaidRevenue + totalDebtRevenue) - (totalOperatingExpenses + totalLoanRepayments + totalDirectCosts + electricityCost);
    
    const devCut = grossProfit > 0 ? grossProfit * (pricingConfig.devPercent / 100) : 0;
    const netProfitPaid = grossProfit - devCut;

    const totalNetBusinessFlow = (Math.max(0, netCashInPlace) + Math.max(0, netBankInPlace));
    const cashRatio = totalNetBusinessFlow > 0 ? (Math.max(0, netCashInPlace) / totalNetBusinessFlow) : 1;
    const bankRatio = 1 - cashRatio;

    const partners = GLOBAL_PARTNERS.map(p => {
        const baseShare = Math.max(0, netProfitPaid * (p.percent / 100));
        
        const cashShareAllocated = baseShare * cashRatio;
        const bankShareAllocated = baseShare * bankRatio;

        const myCashPurchases = periodEntries.filter(e => e.partnerId === p.id && e.channel === 'cash' && (e.type === TransactionType.PARTNER_DEPOSIT) && (e.description.includes('شراء') || e.description.includes('بضاعة'))).reduce((s, e) => s + (e.amount || 0), 0);
        const myBankPurchases = periodEntries.filter(e => e.partnerId === p.id && e.channel === 'bank' && (e.type === TransactionType.PARTNER_DEPOSIT) && (e.description.includes('شراء') || e.description.includes('بضاعة'))).reduce((s, e) => s + (e.amount || 0), 0);
        
        const myCashWithdrawals = periodEntries.filter(e => e.partnerId === p.id && e.channel === 'cash' && e.type === TransactionType.PARTNER_WITHDRAWAL).reduce((s, e) => s + (e.amount || 0), 0);
        const myBankWithdrawals = periodEntries.filter(e => e.partnerId === p.id && e.channel === 'bank' && e.type === TransactionType.PARTNER_WITHDRAWAL).reduce((s, e) => s + (e.amount || 0), 0);
        
        const finalPayoutCash = cashShareAllocated + myCashPurchases - myCashWithdrawals;
        const finalPayoutBank = bankShareAllocated + myBankPurchases - myBankWithdrawals;

        return {
            name: p.name, sharePercent: p.percent / 100, baseShare, 
            cashShareAvailable: cashShareAllocated, bankShareAvailable: bankShareAllocated,
            purchasesReimbursement: myCashPurchases + myBankPurchases, 
            loanRepaymentCash: 0, loanRepaymentBank: 0, 
            placeDebtDeducted: myCashWithdrawals + myBankWithdrawals,
            finalPayoutCash, 
            finalPayoutBank,
            finalPayoutTotal: finalPayoutCash + finalPayoutBank, 
            remainingDebt: 0
        };
    });

    const partnerFundedList = periodEntries
        .filter(e => e.type === TransactionType.PARTNER_DEPOSIT && (e.description.includes('شراء') || e.description.includes('بضاعة')))
        .map(e => ({ name: e.description, amount: e.amount, date: e.dateKey }));

    const otherExpensesList = periodEntries
        .filter(e => (e.type === TransactionType.EXPENSE_OPERATIONAL || e.type === TransactionType.EXPENSE_PURCHASE) && !isVirtualExpense(e))
        .map(e => ({ name: e.description, amount: e.amount, date: e.dateKey }));

    return {
        id: generateId(), type: 'manual', archiveId: 'LEDGER-SNAP', archiveDate: new Date().toISOString(),
        periodStart: startDate, periodEnd: endDate, createdAt: Date.now(), 
        totalPaidRevenue,
        totalCashRevenue: cashRevenuePaid, 
        totalBankRevenue: bankRevenuePaid,
        totalDiscounts: 0, 
        totalDebtRevenue, 
        totalInvoice: totalPaidRevenue + totalDebtRevenue,
        totalPlaceCost, totalDrinksCost, totalCardsCost,
        totalExpenses: totalOperatingExpenses, 
        totalLoanRepayments: totalLoanRepayments, 
        totalSavings,
        electricityCost,
        totalCashExpenses: cashExpensesPhysical, totalBankExpenses: bankExpensesPhysical,
        netCashInPlace, netBankInPlace,
        grossProfit, devCut, netProfitPaid, devPercentSnapshot: pricingConfig.devPercent, partners,
        
        expensesDetails: {
            fixed: [],
            oneTime: [...otherExpensesList, ...partnerFundedList],
            autoPurchases: [],
            loanRepayments: []
        }
    };
};

export const migrateLegacyDataToLedger = (records: Record[], expenses: Expense[], transfers: CashTransfer[], debts: DebtItem[], placeLoans: PlaceLoan[]): LedgerEntry[] => {
    const ledger: LedgerEntry[] = [];
    records.forEach(r => {
        const date = r.endTime.split('T')[0];
        if (r.cashPaid > 0) ledger.push(createEntry(TransactionType.INCOME_SESSION, r.cashPaid, 'in', 'cash', `جلسة: ${r.customerName}`, undefined, r.id, undefined, date, undefined, undefined, 'system', 'ترحيل بيانات'));
        if (r.remainingDebt > 0) ledger.push(createEntry(TransactionType.DEBT_CREATE, r.remainingDebt, 'in', 'receivable', `دين: ${r.customerName}`, undefined, r.id, undefined, date, undefined, undefined, 'system', 'ترحيل بيانات'));
    });
    return ledger.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
