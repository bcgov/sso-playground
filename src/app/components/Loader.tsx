import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

interface LoaderProps {
  count?: number;
}

const Loader: React.FC<LoaderProps> = ({ count = 3 }) => {
  return (
    <SkeletonTheme>
      <p>
        <Skeleton
          count={count}
          height={30}
          inline={true}
          style={{ marginBottom: 8 }}
        />
      </p>
    </SkeletonTheme>
  );
};

export default Loader;
