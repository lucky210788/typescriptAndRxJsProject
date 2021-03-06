import {fromEvent, Observable} from 'rxjs'
import {switchMap, tap} from "rxjs/operators";
import axios from 'axios';

interface User {
  id: number,
  name: string,
  email: string,
  address: object
}

interface Post {
  userId: number,
  id: number,
  title: string,
  body: string
}

interface Comment {
  postId: number,
  id: number,
  name: string,
  email: string,
  body: string
}

interface Response<T> {
  data: Array<T>,
  status: number
}

const btnGetUsers = document.querySelector('.btn-get-users');
const usersList = document.querySelector('.users-list');
const postsList = document.querySelector('.posts');
const commentList = document.querySelector('.comment');
const baseUrl: string = 'https://jsonplaceholder.typicode.com/';

const steamUser$ = fromEvent(btnGetUsers, 'click')
  .pipe(
    tap(() => {
      usersList.innerHTML = '';
      postsList.innerHTML = '';
      commentList.innerHTML = '';
      usersList.classList.add('d-none');
      postsList.classList.add('d-none');
      commentList.classList.add('d-none');
    }),
    switchMap((value: object) =>
      Observable.create((observer: any) => {
        get('users')
          .then(response => {
            const arr: any = response;
            for (let user of arr) {
              observer.next(user);
            }
          })
      })
    )
  );

steamUser$.subscribe(
  (user: User) => {
    usersList.classList.remove('d-none');
    const userItem = usersList.appendChild(document.createElement('li'));
    userItem.className = 'list-item';
    userItem.innerHTML = user.name;

    const steamPost$ = fromEvent(userItem, 'click')
      .pipe(
        tap(() => {
          postsList.innerHTML = '';
          commentList.innerHTML = '';
          postsList.classList.add('d-none');
          commentList.classList.add('d-none');
        }),
        switchMap((value: Object) =>
          Observable.create((observer: any) => {
            get(`posts?userId=${user.id}`)
              .then(response => {
                const arr: any = response;
                for (let post of arr) {
                  observer.next(post);
                }
              })
          })
        )
      );
    steamPost$.subscribe(
      (post: Post) => {
        postsList.classList.remove('d-none');
        const postItem = postsList.appendChild(document.createElement('li'));
        postItem.className = 'posts-list-item list-item';
        postItem.innerHTML = `${post.title}
                                <div class="comments">                               
                                    <div class="spinner"></div>
                                </div>`;
        getCountComments(post.id);
        const steamComment$ = fromEvent(postItem, 'click');
        steamComment$.subscribe(
          () => {
            get(`comments?postId=${post.id}`)
              .then(response => {
                const arr: any = response;
                commentList.innerHTML = '';
                commentList.classList.remove('d-none');
                for (let comment of arr) {
                  const commentItem = commentList.appendChild(document.createElement('li'));
                  commentItem.className = 'list-item';
                  commentItem.innerHTML = comment.name;
                }
              })
          },
          (error: string) => console.error(error)
        )
      },
      (error: string) => console.error(error)
    )
  },
  (error: string) => console.error(error)
);

const showToast = (text: string) => {
  const toast = document.querySelector('.toast');
  toast.classList.remove('d-none');
  toast.innerHTML = text;
  setTimeout((() => {
    toast.classList.add('d-none')
  }), 1000);
};

function getCountComments(id: number) {
  const postsList = document.querySelectorAll('.posts-list-item');
  postsList.forEach((post) => {
    const postBlock = post.querySelector('.comments');
    axios.get(`${baseUrl}comments?postId=${id}`)
      .then((response) => {
        postBlock.innerHTML = String(response.data.length);
      }).catch((error) => {
      console.error(error);
    });
  });
}

function get(url: string) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open('GET', `${baseUrl + url}`);
    request.onload = () => {
      if (request.status === 200) {
        showToast('successful response');
        resolve(JSON.parse(request.response));
      } else {
        showToast('not successful response');
        reject(Error(
          'Произошла ошибка. Код ошибки:' + request.statusText
        ));
      }
    };
    request.send();
  });
}