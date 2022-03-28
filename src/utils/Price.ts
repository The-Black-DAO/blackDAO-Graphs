import {
    SUSHI_USDC_ETH_PAIR, SUSHI_OHMDAI_PAIRV2
} from './Constants'
import {
    SUSHI_OHMDAI_PAIRV2_BLOCK,
    UNI_OHMFRAX_PAIRV2_BLOCK,
    SUSHI_OHMETH_PAIRV2_BLOCK,
    SUSHI_USDC_ETH_PAIR_BLOCK
} from './Constants'
import { Address, BigDecimal, bigInt, BigInt, log } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/sOlympusERC20V3/UniswapV2Pair';
import { toDecimal } from './Decimals'
import { Transaction } from '../../generated/schema'


let BIG_DECIMAL_1E8 = BigDecimal.fromString('1e8')
let BIG_DECIMAL_1E9 = BigDecimal.fromString('1e9')
let BIG_DECIMAL_1E10 = BigDecimal.fromString('1e10')
let BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export function getETHUSDRate(block: BigInt): BigDecimal {
    let ethRate: BigDecimal = new BigDecimal(new BigInt(1));

    if(block.gt(BigInt.fromString(SUSHI_USDC_ETH_PAIR_BLOCK)) ){
        
        let pair = UniswapV2Pair.bind(Address.fromString(SUSHI_USDC_ETH_PAIR))

        let reserves = pair.getReserves()
        let reserve0 = reserves.value0.toBigDecimal()
        let reserve1 = reserves.value1.toBigDecimal()

        ethRate = reserve0.div(reserve1).times(BIG_DECIMAL_1E12)
        log.debug("ETH rate {}", [ethRate.toString()])

    }

    return ethRate
}

export function getOHMUSDRate(block: BigInt): BigDecimal {
    
    let ohmRate = new BigDecimal(new BigInt(1))

    if(block.gt(BigInt.fromString(SUSHI_OHMDAI_PAIRV2_BLOCK))){

        let pair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMDAI_PAIRV2))

        let reserves = pair.getReserves()
        let reserve0 = reserves.value0.toBigDecimal()
        let reserve1 = reserves.value1.toBigDecimal()

        ohmRate = reserve1.div(reserve0).div(BIG_DECIMAL_1E9)
        log.debug("OHM rate {}", [ohmRate.toString()])
    }

    return ohmRate
}

//(slp_treasury/slp_supply)*(2*sqrt(lp_dai * lp_ohm))
export function getDiscountedPairUSD(lp_amount: BigInt, pair_adress: string, block: BigInt): BigDecimal{
    let result = new BigDecimal(new BigInt(1))
    
    if(block.gt(BigInt.fromString(SUSHI_OHMDAI_PAIRV2_BLOCK)) && block.gt(BigInt.fromString(UNI_OHMFRAX_PAIRV2_BLOCK)) && block.gt(BigInt.fromString(SUSHI_OHMETH_PAIRV2_BLOCK))){
        let pair = UniswapV2Pair.bind(Address.fromString(pair_adress))

        let total_lp = pair.totalSupply()
        let lp_token_1 = toDecimal(pair.getReserves().value0, 9)
        let lp_token_2 = toDecimal(pair.getReserves().value1, 18)
        let kLast = lp_token_1.times(lp_token_2).truncate(0).digits

        let part1 = toDecimal(lp_amount,18).div(toDecimal(total_lp,18))
        let two = BigInt.fromI32(2)

        let sqrt = kLast.sqrt();
        let part2 = toDecimal(two.times(sqrt), 0)
        result = part1.times(part2)
    }

    return result
}

export function getPairUSD(lp_amount: BigInt, pair_adress: string, block: BigInt): BigDecimal{
    let result = new BigDecimal(new BigInt(1))
    
    if(block.gt(BigInt.fromString(SUSHI_OHMDAI_PAIRV2_BLOCK)) && block.gt(BigInt.fromString(UNI_OHMFRAX_PAIRV2_BLOCK))){
        let pair = UniswapV2Pair.bind(Address.fromString(pair_adress))
        let total_lp = pair.totalSupply()
        let lp_token_0 = pair.getReserves().value0
        let lp_token_1 = pair.getReserves().value1
        let ownedLP = toDecimal(lp_amount,18).div(toDecimal(total_lp,18))
        let ohm_value = toDecimal(lp_token_0, 9).times(getOHMUSDRate(block))
        let total_lp_usd = ohm_value.plus(toDecimal(lp_token_1, 18))
        result = ownedLP.times(total_lp_usd)
    }

    return result
}

export function getPairWETH(lp_amount: BigInt, pair_adress: string, block: BigInt): BigDecimal{
    let result = new BigDecimal(new BigInt(1))

    SUSHI_OHMETH_PAIRV2_BLOCK
    if(block.gt(BigInt.fromString(SUSHI_OHMETH_PAIRV2_BLOCK))){   
         
        let pair = UniswapV2Pair.bind(Address.fromString(pair_adress))
        let total_lp = pair.totalSupply()
        let lp_token_0 = pair.getReserves().value0
        let lp_token_1 = pair.getReserves().value1
        let ownedLP = toDecimal(lp_amount,18).div(toDecimal(total_lp,18))
        let ohm_value = toDecimal(lp_token_0, 9).times(getOHMUSDRate(block))
        let eth_value = toDecimal(lp_token_1, 18).times(getETHUSDRate(block))
        let total_lp_usd = ohm_value.plus(eth_value)
        result = ownedLP.times(total_lp_usd)
    }

    return result
}