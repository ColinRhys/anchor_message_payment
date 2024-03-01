use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token::TokenAccount;

declare_id!("6yM6tgtjWJnoAGzrM7jP4oHwLXBfjkfJbszEFRtBTTaL");

#[program]
pub mod anchor_message_payment {
    use anchor_lang::solana_program::entrypoint::ProgramResult;

    use super::*;

    // Setup / Constructor
    // Things needed for initial state
    // Called to "set everything up" before users start to use the application
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let global_state = &mut ctx.accounts.global_state;
        global_state.total_amount_sol_transacted = 0;
        Ok(())
    }

    pub fn send_message(
    ctx: Context<SendMessage>,
    uuid: String,
    message: String,
    amount: u64,
) -> ProgramResult {
    // Logic to process the message and the SOL payment
    // Calculate the dApp fee
    let fee = amount * 15 / 100;
    let to_recipient_pending = amount - fee;

    // Transfer fee to the dApp's fee account
    invoke(
        &system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.program_fee_account.key(),
            fee,
        ),
        &[
            ctx.accounts.user.to_account_info().clone(),
            ctx.accounts.program_fee_account.to_account_info().clone(),
        ],
    )?;

    // Transfer remaining amount to the recipient's account
    // invoke - call or invoke another instruction from within Solana program
    invoke(
        &system_instruction::transfer( //instruction to transfer SOL from one account to another
            &ctx.accounts.user.key(), //Account sol will be deducted from
            &ctx.accounts.recipient_pending.key(), // Public key of the recipient account
            to_recipient_pending, // Amount of SOL to transfer - Message amount minus fee
        ),
        &[
            ctx.accounts.user.to_account_info().clone(),
            ctx.accounts.recipient_pending.to_account_info().clone(),
        ],
    )?;

    // Save the message with the uuid and payment details
    let message_account = &mut ctx.accounts.message_account;
    message_account.uuid = uuid;
    message_account.message = message;
    message_account.sender = ctx.accounts.user.key();
    message_account.recipient = ctx.accounts.recipient.key(); //TODO - ensure below is in lamports the correct number of units
    message_account.lamports = amount; // Or save the original 'amount' if preferred 
    message_account.read = false;

    // update global state
    let global_state = &mut ctx.accounts.global_state;
    global_state.total_amount_sol_transacted += amount;

    Ok(())
    }

    pub fn create_content_creator_account(
        ctx: Context<CreateContentCreatorAccount>,
        profile_info: String,
    ) -> ProgramResult {
        let content_creator_account = &mut ctx.accounts.content_creator_account;
        content_creator_account.profile_info = profile_info;
        Ok(())
    }

    pub fn mark_message_as_read(
        ctx: Context<MarkMessageAsRead>,
        _message_id: String,
    ) -> Result<()> {
        let message_account = &mut ctx.accounts.message_account;

        // Verify the content creator is the recipient of the message
        require!(
            message_account.recipient == ctx.accounts.content_creator.key(),
            CustomError::UnauthorizedAccess
        );

        // Check if the message has already been marked as read
        require!(
            !message_account.read,
            CustomError::MessageAlreadyRead
        );

        let transfer_amount = message_account.lamports;

        invoke(&system_instruction::transfer(&ctx.accounts.recipient_pending.key(),
        &ctx.accounts.recipient_withdrawal.key(),
        transfer_amount), // Use transfer_amount directly without dereferencing
            &[
                ctx.accounts.recipient_pending.to_account_info().clone(),
                ctx.accounts.recipient_withdrawal.to_account_info().clone(),
            ],
        )?;

        // Mark the message as read
        message_account.read = true;
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
pub struct SendMessage<'info> {
    #[account(mut)]
    pub user: Signer<'info>, // The fan sending the message and payment.
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>, // User account ready for withdrawal
    #[account(mut)]
    pub recipient_pending: Account<'info, TokenAccount>, // User account for pending withdrawal
    #[account(mut)]
    pub program_fee_account: Account<'info, TokenAccount>, // dApp's fee account.
    #[account(init, payer = user, space = 8 + 256, seeds = [b"message", user.key().as_ref()], bump)]
    pub message_account: Account<'info, MessageAccount>, // Account for storing message data.
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
}

#[account]
pub struct MessageAccount {
    pub uuid: String,
    pub message: String,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub lamports: u64,
    pub read: bool,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(profile_info: String)]
pub struct CreateContentCreatorAccount<'info> {
    // May need to adjust the size
    #[account(init, payer = user, space = 8 + 256, seeds = [b"content_creator", profile_info.as_bytes()], bump)]
    pub content_creator_account: Account<'info, ContentCreator>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ContentCreator {
    pub profile_info: String,
    // Additional fields as needed
}

#[derive(Accounts)]
pub struct MarkMessageAsRead<'info> {
    #[account(mut)]
    pub content_creator: Signer<'info>, // Ensures only the content creator can mark the message as read.
    #[account(
        mut,
        seeds = [b"message", content_creator.key().as_ref()],
        bump = message_account.bump // Assuming bump is stored or known for verification
    )]
    pub message_account: Account<'info, MessageAccount>, // The message to be marked as read.
    #[account(mut)]
    pub recipient_pending: Account<'info, TokenAccount>, // Pending account for funds
    #[account(mut)]
    pub recipient_withdrawal: Account<'info, TokenAccount>, // Withdrawal-ready account
}

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized access attempt.")]
    UnauthorizedAccess,
    #[msg("The message has already been read.")]
    MessageAlreadyRead,
}