#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, log, symbol_short, Address, Env, String,
    Vec,
};

/// Maximum number of swap entries stored. Oldest entries are evicted when full.
const MAX_HISTORY: u32 = 20;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    /// Amount must be greater than zero.
    InvalidAmount = 1,
    /// Asset code must not be empty.
    InvalidAsset = 2,
    /// Timestamp must be positive.
    InvalidTimestamp = 3,
}

/// A single recorded swap entry.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapEntry {
    pub user: Address,
    pub from_asset: String,
    pub to_asset: String,
    pub amount: i128,
    pub timestamp: u64,
}

#[contract]
pub struct NovaSwapLog;

#[contractimpl]
impl NovaSwapLog {
    /// Record a swap. Caller must authenticate (`require_auth`).
    /// Validates inputs, stores the entry (capped at MAX_HISTORY), and emits a SwapRecorded event.
    pub fn record_swap(
        env: Env,
        user: Address,
        from_asset: String,
        to_asset: String,
        amount: i128,
        timestamp: u64,
    ) -> Result<(), Error> {
        // Only the user themselves can log their swap.
        user.require_auth();

        // Validate inputs.
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if from_asset.len() == 0 {
            return Err(Error::InvalidAsset);
        }
        if to_asset.len() == 0 {
            return Err(Error::InvalidAsset);
        }
        if timestamp == 0 {
            return Err(Error::InvalidTimestamp);
        }

        let entry = SwapEntry {
            user: user.clone(),
            from_asset: from_asset.clone(),
            to_asset: to_asset.clone(),
            amount,
            timestamp,
        };

        // Load or create the swap history vector.
        let key = symbol_short!("swaps");
        let mut swaps: Vec<SwapEntry> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));

        // Append new entry; if at capacity, remove the oldest (front).
        if swaps.len() >= MAX_HISTORY {
            swaps.pop_front();
        }
        swaps.push_back(entry);

        env.storage().persistent().set(&key, &swaps);

        // Emit event for frontend subscription.
        env.events().publish(
            (symbol_short!("swap"),),
            (user, from_asset, to_asset, amount, timestamp),
        );

        log!(&env, "Swap recorded");

        Ok(())
    }

    /// Return the most recent swaps (up to MAX_HISTORY).
    pub fn get_recent_swaps(env: Env) -> Vec<SwapEntry> {
        let key = symbol_short!("swaps");
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    #[test]
    fn test_record_and_get() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(NovaSwapLog, ());
        let client = NovaSwapLogClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        client.record_swap(
            &user,
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "USDC"),
            &1_000_000_0i128,
            &1700000000u64,
        );

        let swaps = client.get_recent_swaps();
        assert_eq!(swaps.len(), 1);
        assert_eq!(swaps.get(0).unwrap().amount, 1_000_000_0i128);
    }

    #[test]
    fn test_cap_at_max() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(NovaSwapLog, ());
        let client = NovaSwapLogClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        // Insert 25 entries — only the last 20 should remain.
        for i in 0..25u64 {
            client.record_swap(
                &user,
                &String::from_str(&env, "XLM"),
                &String::from_str(&env, "USDC"),
                &((i as i128 + 1) * 100),
                &(1700000000u64 + i),
            );
        }

        let swaps = client.get_recent_swaps();
        assert_eq!(swaps.len(), 20);
        // Oldest remaining should be entry #6 (i=5, amount=600).
        assert_eq!(swaps.get(0).unwrap().amount, 600);
    }

    #[test]
    fn test_invalid_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(NovaSwapLog, ());
        let client = NovaSwapLogClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        let result = client.try_record_swap(
            &user,
            &String::from_str(&env, "XLM"),
            &String::from_str(&env, "USDC"),
            &0i128,
            &1700000000u64,
        );
        assert!(result.is_err());
    }
}
