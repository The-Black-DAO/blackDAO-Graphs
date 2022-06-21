import { 
  Approval as ApprovalEvent,
  LogRebase as LogRebaseEvent,
  LogSupply as LogSupplyEvent,
  LogStakingContractUpdated as LogStakingContractUpdatedEvent,
  Transfer as TransferEvent,
} from '../generated/sBlackDaoERC20V3/sBlackDaoERC20V3'
import {
  Approval, 
  LogRebase, 
  LogSupply,
  LogStakingContractUpdated, 
  Transfer
} from '../generated/schema'
import { loadOrCreateTransaction } from './utils/Transactions'
import { updateProtocolMetrics } from './utils/ProtocolMetrics'

export function handleApproval(event: ApprovalEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Approval(transaction.id)
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  updateProtocolMetrics(transaction)
  entity.save()
}

export function handleLogRebase(event: LogRebaseEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new LogRebase(transaction.id)
  entity.epoch = event.params.epoch
  entity.rebase = event.params.rebase
  entity.index = event.params.index
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  updateProtocolMetrics(transaction)
  entity.save()
}

export function handleLogSupply(event: LogSupplyEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new LogSupply(transaction.id)
  entity.epoch = event.params.epoch
  entity.totalSupply = event.params.totalSupply
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  updateProtocolMetrics(transaction)
  entity.save()
}

export function handleLogStakingContractUpdated(event: LogStakingContractUpdatedEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new LogStakingContractUpdated(transaction.id)
  entity.stakingContract = event.params.stakingContract
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  updateProtocolMetrics(transaction)
  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let transaction = loadOrCreateTransaction(event.transaction, event.block)
  let entity = new Transfer(transaction.id)
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.timestamp = transaction.timestamp
  entity.transaction = transaction.id
  updateProtocolMetrics(transaction)
  entity.save()
}
