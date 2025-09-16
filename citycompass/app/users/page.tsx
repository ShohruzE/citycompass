import React from 'react'

interface User {
    id: number;
    name: string;
}

const UsersPage = async() => {
    //in server components we can make fetch calls
    const res = await fetch('https://jsonplaceholder.typicode.com/users');
    const users: User[] = await res.json();
    // we annotated users with its type, users array
    return (
        <>
            <h1>Users</h1>
            <ul>
                {users.map(user => <li key={user.id}> {user.name}</li>)}
            </ul>


        </>
    )
}

export default UsersPage