import {
  CreateDebt as CreateDebtEvent,
  Deposit as DepositEvent,
  RepayDebt as RepayDebtEvent,
  ReservesAudited as ReservesAuditedEvent,
  Withdrawal as WithdrawalEvent,
} from '../generated/OlympusTreasury/OlympusTreasury'
import {
  CreateDebt,
  Deposit,
  RepayDebt,
  ReservesAudited,
  Withdrawal
} from '../generated/schema'

import { loadOrCreateTransaction } from './utils/Transactions'

export function handleCreateDebt(event: CreateDebtEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new CreateDebt(transaction.id)
  entity.debtor = event.params.debtor
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.value = event.params.value
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.save()
}

export function handleDeposit(event: DepositEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Deposit(transaction.id)
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()
}

export function handleRepayDebt(event: RepayDebtEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new RepayDebt(transaction.id)
  entity.debtor = event.params.debtor
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()
}

export function handleReservesAudited(event: ReservesAuditedEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new ReservesAudited(transaction.id)
  entity.totalReserves = event.params.totalReserves
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Withdrawal(transaction.id)
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  entity.save()
}
