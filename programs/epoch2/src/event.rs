use anchor_lang::prelude::*;

#[event]
pub struct EpochEvent {
    pub label: String,
    pub status: String,
}

impl EpochEvent {
    pub fn success_event(label: String) -> EpochEvent {
        return EpochEvent {
            label: label,
            status: "success".to_string(),
        };
    }
}
