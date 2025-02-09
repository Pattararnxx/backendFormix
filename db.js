import bcrypt from 'bcrypt';

// export const users = async () => {
//     return [
//         {
//             email:"pattararnx@gmail.com",
//             password: await bcrypt.hash('123456789', 10)
//         }
//     ];
// }
export const users = [
    {
        email:"pattararnx@gmail.com",
        password: bcrypt.hashSync('123456789', 10) 
    }
];

export const publicPosts = [
    {
        title: "Free Tips on Development",
        content: "These are some tips"
    },
    {
        title: "Free Tips on Development",
        content: "These are some tips"
    },
    {
        title: "Free Tips on Development",
        content: "These are some tips"
    }
]

export const privatePosts = [
    {
        title:"Paid Tips on Development",
        content:"These are some tips"
    },
    {
        title:"Paid Tips on Development",
        content: "These are some tips"
    },
    {
        title:"Paid Tips on Development",
        content: "These are some tips"
    }
]