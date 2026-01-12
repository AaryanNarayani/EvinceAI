import { createSlice } from "@reduxjs/toolkit";

const PromptSlice = createSlice({
    name : 'prompt',
    initialState : {
        prompt : "",
    },
    reducers : {
        setPrompt(state, action) {
            state.prompt = action.payload;
        },
    }
})

export default PromptSlice.reducer;
export const {setPrompt} = PromptSlice.actions;