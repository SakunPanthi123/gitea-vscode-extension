const IconsMap = {
  trash: (
    <svg
      height={20}
      width={20}
      xmlns="http://www.w3.org/2000/svg"
      x="10px"
      y="10px"
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M 10 2 L 9 3 L 3 3 L 3 5 L 4.109375 5 L 5.8925781 20.255859 L 5.8925781 20.263672 C 6.023602 21.250335 6.8803207 22 7.875 22 L 16.123047 22 C 17.117726 22 17.974445 21.250322 18.105469 20.263672 L 18.107422 20.255859 L 19.890625 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 6.125 5 L 17.875 5 L 16.123047 20 L 7.875 20 L 6.125 5 z"
      ></path>
    </svg>
  ),
};

export const Icons = ({ name }: { name: keyof typeof IconsMap }) => {
    return IconsMap[name] || <span>Icon not found</span>;
};
