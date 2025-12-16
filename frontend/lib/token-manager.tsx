let tokenInMemory: string | null = null;

export const tokenManager = {
    set(token: string)
    {
        tokenInMemory = token;
        localStorage.setItem('token', token);
    },
    get()
    {
        return tokenInMemory || localStorage.getItem('token');
    },
    clear()
    {
        tokenInMemory = null;
        localStorage.removeItem('token');
    }
}