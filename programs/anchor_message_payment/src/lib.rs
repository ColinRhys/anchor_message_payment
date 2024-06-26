use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;
use dotenv::dotenv;

declare_id!("CsumFKj4paZ66y3g4E1CkFqVK57H9igGKZ1oGCc2pPyV");

#[program]
pub mod anchor_message_payment {

    use std::{env, str::FromStr};

    use anchor_lang::solana_program::entrypoint::ProgramResult;

    use super::*;

    // This function
    // sets up initial state and set global_state value to 0
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        global_state.total_amount_sol_transacted = 0;
        Ok(())
    }

    // This function
    // - Creates user_details account and set values
    pub fn create_message_recipient_user(
        ctx: Context<MessageRecipientUserAccount>,
        profile_info: String,
    ) -> ProgramResult {
        let content_creator_account = &mut ctx.accounts.user_details;
        content_creator_account.user_uuid = profile_info;
        content_creator_account.authority = ctx.accounts.user.key();
        content_creator_account.message_num = 0;
        Ok(())
    }

    // This function:
    //  - Sends a message from a non user to a user who has created an account
    //    calculates the fee and net amount to pay user
    //    creates message account and sets correct values
    //    iterates global state values

    pub fn send_message(
        ctx: Context<SendMessage>,
        message_uuid: String,
        message: String,
        amount_of_lamports: u64,
    ) -> Result<()> {
        let amount = amount_of_lamports;
        msg!("The amount variable is set to {:?}", amount);
        let fee = (amount * 15) / 100;
        msg!("The fee variable is set to {:?}", fee);
        let to_recipient_pending = amount - fee;
        msg!(
            "The to_recipient_pending variable is set to {:?}",
            to_recipient_pending
        );

        // Fee account stuff
        // let fee_account_pubkey = env::var("FEE_ACCOUNT_PUBKEY").expect("Expected FEE_ACCOUNT_PUBKEY to be set in .env file");
        // fee_account_pubkey can be set in the env file but the "send_message" test in the test file will fail
        let fee_account_pubkey = "57wSCd1xLp1v9NyfJtaV2qyv3hxsU7JHnjDNyMcwsLTC";
        // hard coding like above prevents the test failure

        // Check to ensure the fee_account has the correct pubkey and was not changed on client side
        require!(
            ctx.accounts.fee_account.key()
                == Pubkey::from_str(&fee_account_pubkey)
                    .expect("Invalid str passed to create pubkey"),
            CustomError::IncorrectFeeAccount
        );

        // Create Fee Transfer Instructions fee to the dApp's fee account using the hardcoded public key
        let transfer_fee_instruction = system_instruction::transfer(
            &ctx.accounts.message_sender.key(),
            &ctx.accounts.fee_account.key(),
            fee,
        );

        // Preform Transfer of fee to the dApp's fee account
        invoke(
            &transfer_fee_instruction,
            &[
                ctx.accounts.message_sender.to_account_info().clone(),
                ctx.accounts.fee_account.to_account_info().clone(),
            ],
        )
        .map_err(|_| CustomError::FeeTransferFailed)?;

        // recipient_pending

        // Transfer remaining amount to the recipient's pda pending account
        invoke(
            &system_instruction::transfer(
                //instruction to transfer SOL from one account to another
                &ctx.accounts.message_sender.key(), //Account sol will be deducted from
                &ctx.accounts.message_recipient_pending_account.key(), // Public key of the recipient account
                to_recipient_pending, // Amount of SOL to transfer - Message amount minus fee
            ),
            &[
                ctx.accounts.message_sender.to_account_info().clone(),
                ctx.accounts
                    .message_recipient_pending_account
                    .to_account_info()
                    .clone(),
            ],
        )
        .map_err(|_| CustomError::RecipientTransferFailed)?;

        // Save the message with the uuid and payment details
        let message_account = &mut ctx.accounts.message_account;
        message_account.uuid = message_uuid;
        message_account.message = message;
        message_account.sender = ctx.accounts.message_sender.key();
        message_account.recipient = ctx.accounts.user_details.authority; //TODO - ensure below is in lamports the correct number of units
        message_account.lamports = amount; // Or save the original 'amount' if preferred add extra fields for fees and then net
        message_account.read = false;

        // update the user message count
        let message_recipient = &mut ctx.accounts.user_details;
        message_recipient.message_num += 1;

        // update global state
        let global_state = &mut ctx.accounts.global_state;
        global_state.total_amount_sol_transacted += amount;

        Ok(())
    }

    // This function:
    //  - Allows a message recipient to mark as message as read
    //  - transfers the funds from the recipient_pending to the
    //  - users wallet

    pub fn mark_message_as_read(ctx: Context<MarkMessageAsRead>) -> Result<()> {
        let message_account = &mut ctx.accounts.message_account;

        msg!(
            "The message_account.read at the beginning of the function is: {:?}",
            message_account.read
        );

        // Verify the content creator is the recipient of the message
        require!(
            message_account.recipient == ctx.accounts.message_recipient.key(),
            CustomError::UnauthorizedAccess
        );

        // Check if the message has already been marked as read
        require!(!message_account.read, CustomError::MessageAlreadyRead);

        let transfer_amount = ctx.accounts.recipient_pending.get_lamports();

        ctx.accounts
            .recipient_pending
            .sub_lamports(transfer_amount)?;
        ctx.accounts
            .message_recipient
            .add_lamports(transfer_amount)?;

        // Mark the message as read
        message_account.read = true.to_owned();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = dapp_creator, space = 8 + 8, seeds = [b"global_state"], bump)]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub dapp_creator: Signer<'info>, //dApp will pay for the rent the message sender will pay for transaction costs
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GlobalState {
    total_amount_sol_transacted: u64, // track total amount of sol transacted through the service
}

#[derive(Accounts)]
#[instruction(profile_info: String)]
pub struct MessageRecipientUserAccount<'info> {
    // May need to adjust the size
    #[account(init, payer = user, space = 8 + 256, seeds = [b"user_details", profile_info.as_bytes()], bump)]
    pub user_details: Account<'info, UserDetails>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserDetails {
    pub user_uuid: String,
    pub authority: Pubkey,
    pub message_num: u64,
}

#[derive(Accounts)]
#[instruction(message_uuid: String)]
pub struct SendMessage<'info> {
    #[account(mut)]
    pub message_sender: Signer<'info>, // The fan sending the message and payment.
    /// CHECK: Dynamically Generated PDA From User Seeds
    #[account(init, payer = message_sender, seeds = ["temp_sol".as_bytes(), message_uuid.as_bytes()], bump, space = 500)]
    pub message_recipient_pending_account: Account<'info, RecipientPendingAccount>,
    #[account(mut)]
    pub user_details: Account<'info, UserDetails>,
    /// CHECK: Static fee_account pubkey
    #[account(mut)]
    pub fee_account: AccountInfo<'info>, //The fee account used for the transfer instructions - must pass in as account - https://solana.stackexchange.com/questions/2636/how-to-convert-pubkey-to-accountinfo
    #[account(init, payer = message_sender, seeds = ["message".as_bytes(), message_uuid.as_bytes()], bump, space = 500)]
    pub message_account: Account<'info, MessageAccount>, // Account for storing message data.
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
}

#[account]
pub struct MessageAccount {
    pub lamports: u64,
    pub read: bool,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub uuid: String,
    pub message: String,
}

// TODO - Delete this
#[account]
pub struct MessageUUID {
    pub message_uuid: String,
}

#[derive(Accounts)]
pub struct MarkMessageAsRead<'info> {
    #[account(mut)]
    pub message_recipient: Signer<'info>, // Ensures only the content creator can mark the message as read.
    #[account(mut)]
    pub message_account: Account<'info, MessageAccount>, // The message to be marked as read.
    #[account(mut, seeds = [b"temp_sol", message_account.uuid.as_bytes()], bump)]
    pub recipient_pending: Account<'info, RecipientPendingAccount>, // Pending account for funds
}

#[account]
pub struct RecipientPendingAccount {}

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized access attempt.")]
    UnauthorizedAccess,
    #[msg("The message has already been read.")]
    MessageAlreadyRead,
    #[msg("Incorrect fee account PubKey.")]
    IncorrectFeeAccount,
    #[msg("Failed to transfer fee to the dApp's fee account.")]
    FeeTransferFailed,
    #[msg("Failed to transfer remaining amount to the recipient's pending account.")]
    RecipientTransferFailed,
}
