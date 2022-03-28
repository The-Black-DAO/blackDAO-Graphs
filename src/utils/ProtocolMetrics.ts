import { Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import { OlympusERC20 } from '../../generated/sOlympusERC20V3/OlympusERC20';
import { sOlympusERC20V3 } from '../../generated/sOlympusERC20V3/sOlympusERC20V3';
import { ERC20 } from '../../generated/sOlympusERC20V3/ERC20';
import { UniswapV2Pair } from '../../generated/sOlympusERC20V3/UniswapV2Pair';
import { OlympusStakingV3 } from '../../generated/sOlympusERC20V3/OlympusStakingV3';
import { Distributor } from '../../generated/sOlympusERC20V3/Distributor';

import { ProtocolMetric, Transaction } from '../../generated/schema'
import { ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, WETH_ERC20_CONTRACT, STAKING_CONTRACT_V3, TREASURY_ADDRESS_V3, SOHM_ERC20_CONTRACTV3, OHMV2_ERC20_CONTRACT, DAO_WALLET, SUSHI_OHMETH_PAIRV2, SUSHI_OHMDAI_PAIRV2, UNI_OHMFRAX_PAIRV2, DISTRIBUTOR_CONTRACT_V2 } from './Constants';
import { UNI_OHMFRAX_PAIRV2_BLOCK, SUSHI_OHMDAI_PAIRV2_BLOCK, SUSHI_OHMETH_PAIRV2_BLOCK, SUSHI_USDC_ETH_PAIR_BLOCK} from './Constants'
import { dayFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
import { getOHMUSDRate, getDiscountedPairUSD, getPairUSD, getETHUSDRate, getPairWETH } from './Price';

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric{
    let dayTimestamp = dayFromTimestamp(timestamp);

    let protocolMetric = ProtocolMetric.load(dayTimestamp)
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(dayTimestamp)
        protocolMetric.timestamp = timestamp
        protocolMetric.ohmCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.sOhmCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.totalSupply = BigDecimal.fromString("0")
        protocolMetric.ohmPrice = BigDecimal.fromString("0")
        protocolMetric.marketCap = BigDecimal.fromString("0")
        protocolMetric.totalValueLocked = BigDecimal.fromString("0")
        protocolMetric.treasuryRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMarketValue = BigDecimal.fromString("0")
        protocolMetric.nextEpochRebase = BigDecimal.fromString("0")
        protocolMetric.nextDistributedOhm = BigDecimal.fromString("0")
        protocolMetric.currentAPY = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWETHRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWETHMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmDaiPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmFraxPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmEthPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryStableBacking = BigDecimal.fromString("0")
        protocolMetric.treasuryLPValue = BigDecimal.fromString("0")
        protocolMetric.treasuryVolatileBacking = BigDecimal.fromString("0")
        protocolMetric.treasuryTotalBacking = BigDecimal.fromString("0")

        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}

function getTotalSupply(): BigDecimal{
        let ohm_contract = OlympusERC20.bind(Address.fromString(OHMV2_ERC20_CONTRACT))
        let total_supply = toDecimal(ohm_contract.totalSupply(), 9)
        log.debug("Total Supply {}", [total_supply.toString()])
    return total_supply
}

function getCriculatingSupply(total_supply: BigDecimal): BigDecimal{
    
        let ohm_contract = OlympusERC20.bind(Address.fromString(OHMV2_ERC20_CONTRACT))
        let circ_supply = total_supply.minus(toDecimal(ohm_contract.balanceOf(Address.fromString(DAO_WALLET)), 9))
        log.debug("Circulating Supply {}", [circ_supply.toString()])
    return circ_supply
}

function getSohmSupply(): BigDecimal{
    let sohm_supply = BigDecimal.fromString("0")

    let sohm_contract_v3 = sOlympusERC20V3.bind(Address.fromString(SOHM_ERC20_CONTRACTV3))
    sohm_supply = toDecimal(sohm_contract_v3.circulatingSupply(), 9)
    
    log.debug("sOHM Supply {}", [sohm_supply.toString()])
    return sohm_supply
}

function getMV_RFV(block: BigInt): BigDecimal[]{
    let daiERC20 = ERC20.bind(Address.fromString(ERC20DAI_CONTRACT))
    let fraxERC20 = ERC20.bind(Address.fromString(ERC20FRAX_CONTRACT))
    let wethERC20 = ERC20.bind(Address.fromString(WETH_ERC20_CONTRACT))

    let ohmdaiPairV2 = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMDAI_PAIRV2))
    let ohmfraxPairV2 = UniswapV2Pair.bind(Address.fromString(UNI_OHMFRAX_PAIRV2))
    let ohmethPairv2 = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMETH_PAIRV2))

    let daiBalance = daiERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    let fraxBalance = fraxERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    
    //Cross chain assets that can not be tracked right now 20000000
    // tokemak 7.5 MM
    // butterfly 10% MC = 45MM
    let volatile_value = BigDecimal.fromString("0") 

    let wethBalance = (wethERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3)))
    let weth_value = toDecimal(wethBalance, 18).times(getETHUSDRate(block))

    //OHMDAIv2
    let ohmdaiSushiBalancev2 = BigInt.fromI32(0)
    let ohmdai_valuev2 = BigDecimal.fromString("0")
    let ohmdai_rfvv2 = BigDecimal.fromString("0")
    let ohmdaiTotalLPv2 = BigDecimal.fromString("0")
    let ohmdaiPOLv2 = BigDecimal.fromString("0")
    
    if(block.gt(BigInt.fromString(SUSHI_OHMDAI_PAIRV2_BLOCK))){
        
        ohmdaiSushiBalancev2 = ohmdaiPairV2.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
        ohmdai_valuev2 = getPairUSD(ohmdaiSushiBalancev2, SUSHI_OHMDAI_PAIRV2, block)
        ohmdai_rfvv2 = getDiscountedPairUSD(ohmdaiSushiBalancev2, SUSHI_OHMDAI_PAIRV2, block)
        ohmdaiTotalLPv2 = toDecimal(ohmdaiPairV2.totalSupply(), 18)
        if (ohmdaiTotalLPv2.gt(BigDecimal.fromString("0")) &&  ohmdaiSushiBalancev2.gt(BigInt.fromI32(0))){
            ohmdaiPOLv2 = toDecimal(ohmdaiSushiBalancev2, 18).div(ohmdaiTotalLPv2).times(BigDecimal.fromString("100"))
        }

    }
    
    let ohmdaiPOL = ohmdaiPOLv2
    let ohmdai_value = ohmdai_valuev2
    let ohmdai_rfv = ohmdai_rfvv2

    //OHMFRAX
    let ohmfraxBalance = BigInt.fromI32(0)
    let ohmfrax_value = BigDecimal.fromString("0")
    let ohmfrax_rfv = BigDecimal.fromString("0")
    let ohmfraxTotalLP = BigDecimal.fromString("0")
    let ohmfraxPOL = BigDecimal.fromString("0")
    
    if(block.gt(BigInt.fromString(UNI_OHMFRAX_PAIRV2_BLOCK))){
        
        ohmfraxBalance = ohmfraxPairV2.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
        ohmfrax_value = ohmfrax_rfv.plus(getPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIRV2, block))
        ohmfrax_rfv = ohmfrax_rfv.plus(getDiscountedPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIRV2, block))
        ohmfraxTotalLP = toDecimal(ohmfraxPairV2.totalSupply(), 18)
        if (ohmfraxTotalLP.gt(BigDecimal.fromString("0")) &&  ohmfraxBalance.gt(BigInt.fromI32(0))){
            ohmfraxPOL = ohmfraxPOL.plus(toDecimal(ohmfraxBalance, 18).div(ohmfraxTotalLP).times(BigDecimal.fromString("100")))
        }

    }

    //OHMETH
    let ohmethBalance = BigInt.fromI32(0)
    let ohmeth_value = BigDecimal.fromString("0")
    let ohmeth_rfv = BigDecimal.fromString("0")
    let ohmethTotalLP = BigDecimal.fromString("0")
    let ohmethPOL = BigDecimal.fromString("0")
    
    if(block.gt(BigInt.fromString(SUSHI_OHMETH_PAIRV2_BLOCK))){

        ohmethBalance = ohmethPairv2.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
        log.debug("ohmethBalance {}", [ohmethBalance.toString()])

        ohmeth_value = getPairWETH(ohmethBalance, SUSHI_OHMETH_PAIRV2, block)
        log.debug("ohmeth_value {}", [ohmeth_value.toString()])

        ohmeth_rfv = getDiscountedPairUSD(ohmethBalance, SUSHI_OHMETH_PAIRV2, block)
        ohmethTotalLP = toDecimal(ohmethPairv2.totalSupply(), 18)
        if (ohmethTotalLP.gt(BigDecimal.fromString("0")) &&  ohmethBalance.gt(BigInt.fromI32(0))){
            ohmethPOL = toDecimal(ohmethBalance, 18).div(ohmethTotalLP).times(BigDecimal.fromString("100"))
        }

    }

    let stableValue = daiBalance.plus(fraxBalance)
    let stableValueDecimal = toDecimal(stableValue, 18)

    let lpValue = ohmdai_value.plus(ohmfrax_value).plus(ohmeth_value)
    let rfvLpValue = ohmdai_rfv.plus(ohmfrax_rfv).plus(ohmeth_rfv)

    let mv = stableValueDecimal.plus(lpValue).plus(weth_value).plus(volatile_value)
    let rfv = stableValueDecimal.plus(rfvLpValue)

    let treasuryStableBacking = stableValueDecimal
    let treasuryVolatileBacking = volatile_value.plus(weth_value)
    let treasuryTotalBacking = treasuryStableBacking.plus(treasuryVolatileBacking)
    let treasuryLPValue = lpValue

    log.debug("Treasury Market Value {}", [mv.toString()])
    log.debug("Treasury RFV {}", [rfv.toString()])
    log.debug("Treasury DAI value {}", [toDecimal(daiBalance, 18).toString()])
    log.debug("Treasury WETH value {}", [weth_value.toString()])
    log.debug("Treasury OHM-DAI RFV {}", [ohmdai_rfv.toString()])
    log.debug("Treasury Frax value {}", [toDecimal(fraxBalance, 18).toString()])
    log.debug("Treasury OHM-FRAX RFV {}", [ohmfrax_rfv.toString()])

    return [
        mv, 
        rfv,
        ohmdai_rfv.plus(toDecimal(daiBalance, 18)),
        ohmdai_value.plus(toDecimal(daiBalance, 18)),
        ohmfrax_rfv.plus(toDecimal(fraxBalance, 18)),
        ohmfrax_value.plus(toDecimal(fraxBalance, 18)),
        ohmeth_rfv.plus(weth_value),
        ohmeth_value.plus(weth_value),
        ohmdaiPOL,
        ohmfraxPOL,
        ohmethPOL,
        treasuryStableBacking,
        treasuryVolatileBacking,
        treasuryTotalBacking,
        treasuryLPValue
    ]
}

function getNextOHMRebase(): BigDecimal{
        let staking_contract_v3 = OlympusStakingV3.bind(Address.fromString(STAKING_CONTRACT_V3))
        let distribution_v3 = toDecimal(staking_contract_v3.epoch().value3,9)
        log.debug("next_distribution v3 {}", [distribution_v3.toString()])
        let next_distribution = distribution_v3
        log.debug("next_distribution total {}", [next_distribution.toString()])

        return next_distribution
}

function getAPY_Rebase(sOHM: BigDecimal, distributedOHM: BigDecimal): BigDecimal[]{
    let nextEpochRebase: BigDecimal = new BigDecimal(BigInt.fromI32(0))

    if(sOHM.gt(new BigDecimal(BigInt.fromI32(0)))){
        nextEpochRebase = distributedOHM.div(sOHM).times(BigDecimal.fromString("100"));
    }

    let nextEpochRebase_number = Number.parseFloat(nextEpochRebase.toString())
    let currentAPY = Math.pow(((nextEpochRebase_number/100)+1), (365*3)-1) * 100

    let currentAPYdecimal = BigDecimal.fromString(currentAPY.toString())

    log.debug("next_rebase {}", [nextEpochRebase.toString()])
    log.debug("current_apy total {}", [currentAPYdecimal.toString()])

    return [currentAPYdecimal, nextEpochRebase]
}

function getRunway(totalSupply: BigDecimal, rfv: BigDecimal, rebase: BigDecimal): BigDecimal[]{
    let runway2dot5k = BigDecimal.fromString("0")
    let runway5k = BigDecimal.fromString("0")
    let runway7dot5k = BigDecimal.fromString("0")
    let runway10k = BigDecimal.fromString("0")
    let runway20k = BigDecimal.fromString("0")
    let runway50k = BigDecimal.fromString("0")
    let runway70k = BigDecimal.fromString("0")
    let runway100k = BigDecimal.fromString("0")
    let runwayCurrent = BigDecimal.fromString("0")

    if(totalSupply.gt(BigDecimal.fromString("0")) && rfv.gt(BigDecimal.fromString("0")) &&  rebase.gt(BigDecimal.fromString("0"))){
        log.debug("Runway RFV", [rfv.toString()])
        log.debug("Runway totalSupply", [totalSupply.toString()])

        let treasury_runway = Number.parseFloat("0");
        if(totalSupply.gt(new BigDecimal(BigInt.fromI32(0)))){
            treasury_runway = Number.parseFloat(rfv.div(totalSupply).toString())
        }

        let runway2dot5k_num = (Math.log(treasury_runway) / Math.log(1+0.0029438))/3;
        let runway5k_num = (Math.log(treasury_runway) / Math.log(1+0.003579))/3;
        let runway7dot5k_num = (Math.log(treasury_runway) / Math.log(1+0.0039507))/3;
        let runway10k_num = (Math.log(treasury_runway) / Math.log(1+0.00421449))/3;
        let runway20k_num = (Math.log(treasury_runway) / Math.log(1+0.00485037))/3;
        let runway50k_num = (Math.log(treasury_runway) / Math.log(1+0.00569158))/3;
        let runway70k_num = (Math.log(treasury_runway) / Math.log(1+0.00600065))/3;
        let runway100k_num = (Math.log(treasury_runway) / Math.log(1+0.00632839))/3;
        let nextEpochRebase_number = Number.parseFloat(rebase.toString())/100

        let distributorContract_v2 = Distributor.bind(Address.fromString(DISTRIBUTOR_CONTRACT_V2))
        nextEpochRebase_number = Number.parseFloat(toDecimal(distributorContract_v2.info(BigInt.fromI32(0)).value0,6).toString())

        log.debug("Runway rebase", [nextEpochRebase_number.toString()])

        let runwayCurrent_num = (Math.log(treasury_runway) / Math.log(1+nextEpochRebase_number))/3;
        
        runway2dot5k = BigDecimal.fromString(runway2dot5k_num.toString())
        runway5k = BigDecimal.fromString(runway5k_num.toString())
        runway7dot5k = BigDecimal.fromString(runway7dot5k_num.toString())
        runway10k = BigDecimal.fromString(runway10k_num.toString())
        runway20k = BigDecimal.fromString(runway20k_num.toString())
        runway50k = BigDecimal.fromString(runway50k_num.toString())
        runway70k = BigDecimal.fromString(runway70k_num.toString())
        runway100k = BigDecimal.fromString(runway100k_num.toString())
        runwayCurrent = BigDecimal.fromString(runwayCurrent_num.toString())
    }

    return [runway2dot5k, runway5k, runway7dot5k, runway10k, runway20k, runway50k, runway70k, runway100k, runwayCurrent]
}


export function updateProtocolMetrics(transaction: Transaction): void{
    let pm = loadOrCreateProtocolMetric(transaction.timestamp);

    //Total Supply
    pm.totalSupply = getTotalSupply()

    //Circ Supply
    pm.ohmCirculatingSupply = getCriculatingSupply(pm.totalSupply)

    //sOhm Supply
    pm.sOhmCirculatingSupply = getSohmSupply()

    //OHM Price
    pm.ohmPrice = getOHMUSDRate(transaction.blockNumber)

    //OHM Market Cap
    pm.marketCap = pm.ohmCirculatingSupply.times(pm.ohmPrice)

    //Total Value Locked
    pm.totalValueLocked = pm.sOhmCirculatingSupply.times(pm.ohmPrice)

    //Treasury RFV and MV
    let mv_rfv = getMV_RFV(transaction.blockNumber)

    pm.treasuryMarketValue = mv_rfv[0]
    pm.treasuryRiskFreeValue = mv_rfv[1]
    pm.treasuryDaiRiskFreeValue = mv_rfv[2]
    pm.treasuryDaiMarketValue = mv_rfv[3]
    pm.treasuryFraxRiskFreeValue = mv_rfv[4]
    pm.treasuryFraxMarketValue = mv_rfv[5]
    pm.treasuryWETHRiskFreeValue = mv_rfv[6]
    pm.treasuryWETHMarketValue = mv_rfv[7]
    pm.treasuryOhmDaiPOL = mv_rfv[8]
    pm.treasuryOhmFraxPOL = mv_rfv[9]
    pm.treasuryOhmEthPOL = mv_rfv[10]
    pm.treasuryStableBacking = mv_rfv[11]
    pm.treasuryVolatileBacking = mv_rfv[12]
    pm.treasuryTotalBacking = mv_rfv[13]
    pm.treasuryLPValue = mv_rfv[14]

    // Rebase rewards, APY, rebase
    pm.nextDistributedOhm = getNextOHMRebase()
    let apy_rebase = getAPY_Rebase(pm.sOhmCirculatingSupply, pm.nextDistributedOhm)
    pm.currentAPY = apy_rebase[0]
    pm.nextEpochRebase = apy_rebase[1]

    //Runway
    let runways = getRunway(pm.totalSupply, pm.treasuryRiskFreeValue, pm.nextEpochRebase)
    pm.runway2dot5k = runways[0]
    pm.runway5k = runways[1]
    pm.runway7dot5k = runways[2]
    pm.runway10k = runways[3]
    pm.runway20k = runways[4]
    pm.runway50k = runways[5]
    pm.runway70k = runways[6]
    pm.runway100k = runways[7]
    pm.runwayCurrent = runways[8]
  
    pm.save()
}